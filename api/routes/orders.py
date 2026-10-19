from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, field_validator
import re
import os
import json
import logging
import urllib.request
from datetime import datetime, timedelta, timezone
from dependencies import get_supabase, verify_token, check_store_owner


router = APIRouter()
logger = logging.getLogger("storegen.orders")

# ─── Algérie Phone & Sécurité Helpers ──────────────────────────────────────────

def normalize_dz_phone(raw_phone: str) -> str:
    """Nettoie et normalise un numéro algérien au format standard 10 chiffres (ex: 0555123456)."""
    digits = re.sub(r"\D", "", str(raw_phone or ""))
    if digits.startswith("00213"):
        digits = digits[5:]
    elif digits.startswith("213"):
        digits = digits[3:]
    if len(digits) == 9 and digits[0] in ("5", "6", "7"):
        digits = "0" + digits
    return digits


def is_valid_strict_dz_phone(cleaned_phone: str) -> bool:
    """Valide qu'un numéro DZ comporte exactement 10 chiffres et commence par 05, 06 ou 07."""
    return bool(re.match(r"^0[567]\d{8}$", cleaned_phone))


def send_telegram_order_notification(bot_token: str, chat_id: str, order_data: dict, store_name: str):
    """Envoie un récapitulatif de commande formaté sur Telegram sans ralentir la requête."""
    try:
        items_list = order_data.get("items") or []
        items_lines = []
        for it in items_list:
            name = it.get("name") or "Article"
            q = it.get("quantity") or 1
            price = it.get("price") or 0
            items_lines.append(f"  • {name} × {q} ({price} DZD)")
        items_str = "\n".join(items_lines) if items_lines else "  • 1x Commande directe"

        ref = str(order_data.get("id", ""))[-6:].upper()
        text = (
            f"🛍️ <b>Nouvelle commande reçue !</b>\n\n"
            f"🏪 <b>Boutique :</b> {store_name}\n"
            f"🔖 <b>Réf :</b> #{ref}\n\n"
            f"📦 <b>Articles :</b>\n{items_str}\n\n"
            f"👤 <b>Client :</b> {order_data.get('customer_name')}\n"
            f"📞 <b>Téléphone :</b> <code>{order_data.get('customer_phone')}</code>\n"
            f"📍 <b>Adresse / Wilaya :</b> {order_data.get('customer_address')}\n"
            f"💰 <b>Total C.O.D :</b> <b>{order_data.get('total_amount')} DZD</b>\n"
        )
        if order_data.get("notes"):
            text += f"📝 <b>Note :</b> {order_data.get('notes')}\n"

        req = urllib.request.Request(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            data=json.dumps({
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "HTML"
            }).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        urllib.request.urlopen(req, timeout=5)
        logger.info(f"Notification Telegram envoyée avec succès au chat {chat_id}")
    except Exception as e:
        logger.warning(f"Échec notification Telegram (non-bloquant): {e}")

# ─── Constantes de validation des commandes ──────────────────────────────────
MIN_QTY_PER_ITEM = 1
MAX_QTY_PER_ITEM = 10
MAX_ITEMS_PER_ORDER = 10


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class CreateOrderRequest(BaseModel):
    product_id: Optional[str] = None
    options_selected: Optional[Dict[str, Any]] = Field(default_factory=dict)
    qty: Optional[Any] = 1
    wilaya_id: Optional[Any] = None
    ship_mode: Optional[str] = "domicile"  # 'domicile' ou 'stopdesk'
    customer_name: str = Field(..., min_length=2, max_length=80)
    customer_phone: str = Field(..., min_length=9, max_length=20)
    customer_email: Optional[str] = None
    customer_address: Optional[str] = None
    customer_commune: Optional[str] = None
    commune: Optional[str] = None
    wilaya: Optional[str] = None
    store_id: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = None
    total_amount: Optional[float] = None  # Ignoré côté serveur (recalcul strict)
    payment_method: Optional[str] = "cod"
    notes: Optional[str] = Field(default=None, max_length=500)

    @field_validator("customer_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        cleaned = v.strip() if v else ""
        if len(cleaned) < 2 or len(cleaned) > 80:
            raise ValueError("Le nom du client doit comporter entre 2 et 80 caractères")
        return cleaned

    @field_validator("customer_phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r"\D", "", v) if v else ""
        if len(cleaned) < 9 or len(cleaned) > 15:
            raise ValueError("Numéro de téléphone invalide (au moins 9 chiffres requis)")
        return v.strip()


class UpdateOrderStatusRequest(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    notes: Optional[str] = None
    call_attempts: Optional[int] = None
    agent_notes: Optional[str] = None
    cancel_reason: Optional[str] = None
    assigned_to: Optional[str] = None



# Fallback wilayas data au cas où la table n'est pas encore migrée
DEFAULT_WILAYAS_DATA = {
    1: ("Adrar", 950, 600, "3-5 j"),
    9: ("Blida", 500, 300, "24-48h"),
    16: ("Alger", 500, 300, "24-48h"),
    31: ("Oran", 400, 250, "24-48h"),
    25: ("Constantine", 700, 400, "2-4 j"),
    23: ("Annaba", 750, 450, "2-4 j"),
    19: ("Sétif", 700, 400, "2-4 j"),
}

@router.get("/wilayas")
@router.get("/wilayas/")
async def list_wilayas(supabase = Depends(get_supabase)):
    """Retourne la liste des 58 wilayas d'Algérie avec tarifs et délais."""
    try:
        res = supabase.table("wilayas").select("*").order("id", desc=False).execute()
        if res.data:
            return res.data
    except Exception as e:
        logger.warning(f"Lecture table wilayas échouée ({e}), fallback")
    
    return [
        {"id": w_id, "name": name, "price_home": p_home, "price_desk": p_desk, "eta": eta}
        for w_id, (name, p_home, p_desk, eta) in DEFAULT_WILAYAS_DATA.items()
    ]

@router.post("")
@router.post("/")
async def create_order(
    req: CreateOrderRequest,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    supabase = Depends(get_supabase)
):
    """Enregistre une commande avec recalcul strict et intégral des montants côté serveur."""
    # 1. Validation de la boutique
    raw_store_id = req.store_id
    if not raw_store_id or str(raw_store_id).strip().lower() in ("demo", "null", "undefined") or str(raw_store_id).startswith("{{"):
        raise HTTPException(
            status_code=400,
            detail="Identifiant de boutique (store_id) manquant pour cette commande"
        )
    store_id = str(raw_store_id).strip()

    store_check = supabase.table("stores").select("id, name, status, settings").eq("id", store_id).execute()
    if not store_check.data:
        raise HTTPException(status_code=400, detail="Boutique introuvable pour cette commande")

    store_record = store_check.data[0]
    # Exigence 2 : La boutique doit exister et être publiée ('published' ou 'active' dans les données historiques)
    if store_record.get("status") not in ("published", "active"):
        raise HTTPException(
            status_code=400,
            detail="La boutique n'est pas disponible pour recevoir des commandes (statut non publié)"
        )
    if store_record.get("status") == "suspended":
        raise HTTPException(
            status_code=400,
            detail="Cette boutique est actuellement suspendue"
        )

    store_settings = store_record.get("settings") or {}
    security = store_settings.get("security") or {}

    # 2. Validation minimale des champs client
    # Nom : 2 à 80 caractères
    raw_name = (req.customer_name or "").strip()
    if len(raw_name) < 2 or len(raw_name) > 80:
        raise HTTPException(
            status_code=400,
            detail="Le nom du client doit comporter entre 2 et 80 caractères"
        )

    # Téléphone au format algérien (05, 06, 07 suivi de 8 chiffres, ou +213)
    clean_dz_phone = normalize_dz_phone(req.customer_phone)
    if not is_valid_strict_dz_phone(clean_dz_phone):
        raise HTTPException(
            status_code=400,
            detail="Numéro de téléphone algérien invalide. Il doit comporter 10 chiffres et commencer par 05, 06 ou 07 (ou format international +213)."
        )

    # Vérification Liste Noire (Blacklist)
    blacklist = security.get("blacklist") or []
    if blacklist:
        normalized_blacklist = {normalize_dz_phone(b) for b in blacklist if b}
        if clean_dz_phone in normalized_blacklist:
            raise HTTPException(
                status_code=400,
                detail="Ce numéro de téléphone n'est pas autorisé à passer commande sur cette boutique."
            )

    # Anti-Spam commandes (limite à 2 commandes sur 24h par numéro)
    if security.get("anti_spam_orders"):
        cutoff_24h = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        try:
            recent_orders = (
                supabase.table("orders")
                .select("id, customer_phone")
                .eq("store_id", store_id)
                .gte("created_at", cutoff_24h)
                .execute()
            )
            matching = [
                o for o in (recent_orders.data or [])
                if normalize_dz_phone(o.get("customer_phone") or "") == clean_dz_phone
            ]
            if len(matching) >= 2:
                raise HTTPException(
                    status_code=400,
                    detail="Limite de commandes atteinte pour ce numéro dans les dernières 24h. Veuillez patienter ou contacter le service client."
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Vérification anti-spam non bloquante échouée: {e}")

    # Mode de livraison (domicile ou stopdesk)
    ship_mode = (req.ship_mode or "domicile").lower().strip()
    if ship_mode not in ("domicile", "stopdesk", "stop-desk"):
        raise HTTPException(
            status_code=400,
            detail="Mode de livraison invalide. Choisissez 'domicile' ou 'stopdesk'."
        )
    is_home = ship_mode == "domicile"

    # Wilaya (entier entre 1 et 58)
    try:
        wilaya_id = int(req.wilaya_id) if req.wilaya_id is not None else None
    except (ValueError, TypeError):
        wilaya_id = None

    if wilaya_id is None or wilaya_id < 1 or wilaya_id > 58:
        raise HTTPException(
            status_code=400,
            detail="Wilaya de livraison invalide ou inconnue (doit être un entier entre 1 et 58)."
        )

    # Frais de livraison : lus dans shipping_rates de CETTE boutique
    delivery_cost = None
    wilaya_name = req.wilaya or ""

    try:
        sr_res = (
            supabase.table("shipping_rates")
            .select("price_home, price_desk")
            .eq("store_id", store_record["id"])
            .eq("wilaya_id", wilaya_id)
            .execute()
        )
        if sr_res.data:
            delivery_cost = float(sr_res.data[0]["price_home"] if is_home else sr_res.data[0]["price_desk"])
    except Exception as e:
        logger.warning("Erreur lecture shipping_rates pour store %s, repli: %s", store_record["id"], e)

    # Repli sur la table wilayas seulement s'il n'existe pas de ligne pour cette boutique
    if delivery_cost is None:
        try:
            w_res = supabase.table("wilayas").select("name, price_home, price_desk").eq("id", wilaya_id).execute()
            if w_res.data:
                wilaya_name = wilaya_name or w_res.data[0].get("name")
                delivery_cost = float(w_res.data[0]["price_home"] if is_home else w_res.data[0]["price_desk"])
        except Exception as e:
            logger.warning("Erreur lecture table wilayas (%s), repli mémoire", e)

    if delivery_cost is None and wilaya_id in DEFAULT_WILAYAS_DATA:
        name, p_home, p_desk, _ = DEFAULT_WILAYAS_DATA[wilaya_id]
        wilaya_name = wilaya_name or name
        delivery_cost = float(p_home if is_home else p_desk)

    if delivery_cost is None or delivery_cost < 0:
        raise HTTPException(
            status_code=400,
            detail="Tarif de livraison introuvable pour cette wilaya."
        )

    # Adresse : 5 à 300 caractères
    raw_address = (req.customer_address or "").strip()
    if raw_address:
        full_address = raw_address
    else:
        commune = (req.customer_commune or req.commune or "").strip()
        mode_str = "À domicile" if is_home else "Stop Desk"
        parts = []
        if wilaya_name:
            parts.append(f"Wilaya: {wilaya_name} ({mode_str})")
        if commune:
            parts.append(f"Commune: {commune}")
        full_address = " — ".join(parts)

    if len(full_address) < 5 or len(full_address) > 300:
        raise HTTPException(
            status_code=400,
            detail="L'adresse de livraison doit comporter entre 5 et 300 caractères."
        )

    # Notes : 500 caractères maximum
    raw_notes = (req.notes or "").strip()
    if len(raw_notes) > 500:
        raise HTTPException(
            status_code=400,
            detail="La note de commande ne doit pas dépasser 500 caractères."
        )
    clean_notes = raw_notes if raw_notes else None

    # 3. Articles de la commande et recalcul strict des prix en base
    raw_items = []
    if req.items and len(req.items) > 0:
        raw_items = req.items
    elif req.product_id:
        raw_items = [
            {
                "product_id": req.product_id,
                "qty": req.qty if req.qty is not None else 1,
                "options_selected": req.options_selected or {},
            }
        ]

    if len(raw_items) == 0:
        raise HTTPException(status_code=400, detail="La commande doit contenir au moins un article.")

    if len(raw_items) > MAX_ITEMS_PER_ORDER:
        raise HTTPException(
            status_code=400,
            detail=f"Une commande ne peut pas contenir plus de {MAX_ITEMS_PER_ORDER} articles."
        )

    subtotal = 0.0
    validated_items = []

    for item in raw_items:
        p_id = item.get("product_id") or item.get("id")
        if not p_id or not str(p_id).strip():
            raise HTTPException(
                status_code=400,
                detail="Identifiant de produit manquant pour un article de la commande."
            )

        raw_qty = item.get("qty") if item.get("qty") is not None else item.get("quantity")
        if (
            not isinstance(raw_qty, int)
            or isinstance(raw_qty, bool)
            or raw_qty < MIN_QTY_PER_ITEM
            or raw_qty > MAX_QTY_PER_ITEM
        ):
            raise HTTPException(
                status_code=400,
                detail=f"La quantité de chaque article doit être un entier compris entre {MIN_QTY_PER_ITEM} et {MAX_QTY_PER_ITEM}."
            )

        prod_res = (
            supabase.table("products")
            .select("id, name, price, status, store_id, images, options")
            .eq("id", str(p_id).strip())
            .execute()
        )
        if not prod_res.data:
            raise HTTPException(status_code=400, detail="Produit introuvable en base de données.")

        db_product = prod_res.data[0]
        if str(db_product.get("store_id")) != str(store_record["id"]):
            raise HTTPException(
                status_code=400,
                detail="Le produit spécifié n'appartient pas à cette boutique."
            )

        if db_product.get("status") != "active":
            raise HTTPException(
                status_code=400,
                detail="Le produit spécifié n'est pas actif."
            )

        db_price = float(db_product.get("price", 0.0))
        if db_price < 0:
            raise HTTPException(status_code=400, detail="Prix de produit invalide en base.")

        # Le montant est toujours recalculé côté serveur à partir du prix en base
        subtotal += db_price * raw_qty

        images_list = db_product.get("images") or []
        first_image = images_list[0] if isinstance(images_list, list) and len(images_list) > 0 else None

        validated_items.append({
            "product_id": db_product.get("id"),
            "name": db_product.get("name"),
            "price": db_price,
            "quantity": raw_qty,
            "options_selected": item.get("options_selected") or {},
            "image": first_image,
        })

    # Montant total recalculé côté serveur (le total_amount envoyé par le client est ignoré)
    total_amount = round(subtotal + delivery_cost, 2)

    payload = {
        "store_id": store_record["id"],
        "customer_name": raw_name,
        "customer_phone": clean_dz_phone,
        "customer_email": req.customer_email,
        "customer_address": full_address,
        "items": validated_items,
        "total_amount": total_amount,
        "status": "pending",
        "payment_status": "pending",
        "notes": clean_notes,
    }

    try:
        res = supabase.table("orders").insert(payload).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Impossible d'enregistrer la commande")

        created_order = res.data[0]

        # ─── Smart Dispatch Call Center (Global : Boutiques & Funnels) ────────
        try:
            from services.dispatcher import assign_order_smartly
            dispatch_res = assign_order_smartly(created_order.get("id"), store_id, supabase)
            if dispatch_res.get("success"):
                created_order["assigned_to"] = dispatch_res.get("assigned_to")
                created_order["assigned_at"] = dispatch_res.get("assigned_at")
        except Exception as e:
            logger.warning(f"SmartDispatch non bloquant: {e}")

        # ─── Déduction automatique des stocks ─────────────────────────────────
        try:
            for item in validated_items:
                prod_id = item.get("product_id")
                qty = item.get("quantity", 1)
                if not prod_id:
                    continue

                prod_fetch = (
                    supabase.table("products")
                    .select("stock_quantity")
                    .eq("id", str(prod_id))
                    .single()
                    .execute()
                )
                if prod_fetch.data:
                    curr_stock = prod_fetch.data.get("stock_quantity") or 0
                    supabase.table("products").update({
                        "stock_quantity": max(0, curr_stock - qty)
                    }).eq("id", str(prod_id)).execute()
        except Exception as e:
            logger.warning(f"Déduction de stock non bloquante: {e}")

        # ─── Alerte Telegram instantanée (BackgroundTasks) ────────────────────
        notifications = store_settings.get("notifications") or {}
        telegram_chat_id = (notifications.get("telegram_chat_id") or "").strip()
        bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        if telegram_chat_id and bot_token and background_tasks:
            background_tasks.add_task(
                send_telegram_order_notification,
                bot_token,
                telegram_chat_id,
                created_order,
                store_record.get("name") or "Boutique"
            )

        return {
            "message": "Commande enregistrée avec succès",
            "order_id": created_order.get("id"),
            "total_amount": total_amount,
            "subtotal": round(subtotal, 2),
            "shipping_fee": round(delivery_cost, 2),
            "order": created_order,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur enregistrement commande: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")


# ─── Endpoints de consultation & gestion sécurisés (Owner + Équipe Globale) ───

VALID_CALL_CENTER_STATUSES = (
    "pending",
    "confirmed",
    "no_answer",
    "callback",
    "postponed",
    "shipped",
    "delivered",
    "cancelled",
    "unreachable",
    "wrong_number",
    "duplicate",
)


def _check_user_order_access(order_data: dict, user_id: str, supabase) -> bool:
    """Vérifie si l'utilisateur est propriétaire ou membre actif de l'équipe du store."""
    stores_data = order_data.get("stores")
    owner_id = stores_data.get("owner_id") if isinstance(stores_data, dict) else None
    store_id = order_data.get("store_id")

    if owner_id and owner_id == user_id:
        return True

    # Vérification membre de l'équipe globale (par owner_id ou store_id)
    try:
        query = supabase.table("store_members").select("id, status").eq("user_id", user_id)
        if owner_id:
            query = query.or_(f"owner_id.eq.{owner_id},store_id.eq.{store_id}")
        else:
            query = query.eq("store_id", store_id)
        mem_res = query.execute()
        active = [
            m for m in (mem_res.data or [])
            if isinstance(m, dict) and str(m.get("status", "")).lower() in ("active", "invited", "")
        ]
        return bool(active)
    except Exception as e:
        logger.warning(f"Erreur vérification appartenance équipe: {e}")
        return False


@router.get("")
@router.get("/")
async def list_orders(
    store_id: Optional[str] = Query(None, description="Filtrer par boutique spécifique"),
    status: Optional[str] = Query(None, description="Filtrer par statut"),
    user_id: str = Depends(verify_token),
    supabase = Depends(get_supabase),
):
    """
    Récupère la liste des commandes :
    - Propriétaire : toutes les commandes de ses boutiques et funnels.
    - Employé (membre) : accès automatique aux commandes de TOUS les funnels et boutiques de son employeur.
    Chaque commande inclut les infos du Store/Funnel (nom, type).
    """
    # 1. Vérifier si l'utilisateur est un propriétaire ayant des stores
    owner_stores_res = (
        supabase.table("stores")
        .select("id, name, type, owner_id")
        .eq("owner_id", user_id)
        .execute()
    )
    accessible_stores = owner_stores_res.data or []

    # 2. Si pas propriétaire, vérifier s'il est membre de l'équipe globale d'un propriétaire
    if not accessible_stores:
        member_res = (
            supabase.table("store_members")
            .select("owner_id, store_id")
            .eq("user_id", user_id)
            .execute()
        )
        memberships = member_res.data or []
        owner_ids = [m["owner_id"] for m in memberships if isinstance(m, dict) and m.get("owner_id")]
        
        if owner_ids:
            team_stores = (
                supabase.table("stores")
                .select("id, name, type, owner_id")
                .in_("owner_id", owner_ids)
                .execute()
            )
            accessible_stores = team_stores.data or []
        elif memberships:
            # Fallback rétro-compatible par store_id
            direct_store_ids = [m["store_id"] for m in memberships if isinstance(m, dict) and m.get("store_id")]
            if direct_store_ids:
                team_stores = (
                    supabase.table("stores")
                    .select("id, name, type, owner_id")
                    .in_("id", direct_store_ids)
                    .execute()
                )
                accessible_stores = team_stores.data or []

    if not accessible_stores:
        return {"orders": [], "count": 0}

    store_map = {s["id"]: s for s in accessible_stores if isinstance(s, dict) and s.get("id")}
    allowed_store_ids = list(store_map.keys())

    if store_id:
        if store_id not in allowed_store_ids:
            raise HTTPException(status_code=403, detail="Accès refusé à cette boutique")
        allowed_store_ids = [store_id]

    query = (
        supabase.table("orders")
        .select("*")
        .in_("store_id", allowed_store_ids)
        .order("created_at", desc=True)
    )

    if status and status != "all":
        query = query.eq("status", status)

    res = query.execute()
    orders = res.data or []

    # Attacher les métadonnées de la boutique/funnel (nom et type)
    for ord_row in orders:
        if isinstance(ord_row, dict):
            st = store_map.get(ord_row.get("store_id"), {})
            ord_row["store_name"] = st.get("name") or "Boutique"
            ord_row["store_type"] = st.get("type") or "boutique"

    return {"orders": orders, "count": len(orders)}


@router.get("/{order_id}")
async def get_order(
    order_id: str,
    user_id: str = Depends(verify_token),
    supabase = Depends(get_supabase),
):
    """
    Récupère le détail d'une commande.
    Accessible au propriétaire et à tous les membres de son équipe globale.
    """
    order_res = (
        supabase.table("orders")
        .select("*, stores(id, name, type, owner_id)")
        .eq("id", order_id)
        .single()
        .execute()
    )
    if not order_res or not order_res.data:
        raise HTTPException(status_code=404, detail="Commande introuvable")

    order_data = order_res.data
    if not _check_user_order_access(order_data, user_id, supabase):
        raise HTTPException(status_code=403, detail="Accès refusé : vous n'êtes pas propriétaire de cette commande")

    stores_data = order_data.get("stores") or {}
    if isinstance(stores_data, dict):
        order_data["store_name"] = stores_data.get("name") or "Boutique"
        order_data["store_type"] = stores_data.get("type") or "boutique"

    return order_data


@router.patch("/{order_id}")
async def update_order_status(
    order_id: str,
    payload: UpdateOrderStatusRequest,
    user_id: str = Depends(verify_token),
    supabase = Depends(get_supabase),
):
    """
    Met à jour le statut et les champs Call Center d'une commande.
    Accessible au propriétaire et aux téléopérateurs de son équipe globale.
    """
    order_res = (
        supabase.table("orders")
        .select("*, stores(id, name, type, owner_id)")
        .eq("id", order_id)
        .single()
        .execute()
    )
    if not order_res or not order_res.data:
        raise HTTPException(status_code=404, detail="Commande introuvable")

    order_data = order_res.data
    if not _check_user_order_access(order_data, user_id, supabase):
        raise HTTPException(status_code=403, detail="Accès refusé : vous n'êtes pas propriétaire de cette commande")

    update_fields: Dict[str, Any] = {}
    now_iso = datetime.now(timezone.utc).isoformat()

    if payload.status:
        if payload.status not in VALID_CALL_CENTER_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Statut invalide. Autorisés: {', '.join(VALID_CALL_CENTER_STATUSES)}"
            )
        update_fields["status"] = payload.status
        if payload.status == "confirmed":
            update_fields["confirmed_by"] = user_id
            update_fields["confirmed_at"] = now_iso

    if payload.payment_status:
        valid_payments = ("pending", "paid", "refunded")
        if payload.payment_status not in valid_payments:
            raise HTTPException(
                status_code=400,
                detail=f"Statut de paiement invalide. Autorisés: {', '.join(valid_payments)}"
            )
        update_fields["payment_status"] = payload.payment_status

    if payload.notes is not None:
        update_fields["notes"] = payload.notes

    if payload.agent_notes is not None:
        update_fields["agent_notes"] = payload.agent_notes

    if payload.cancel_reason is not None:
        update_fields["cancel_reason"] = payload.cancel_reason

    if payload.call_attempts is not None:
        update_fields["call_attempts"] = payload.call_attempts
    elif payload.status in ("no_answer", "callback"):
        curr_attempts = order_data.get("call_attempts") or 0
        update_fields["call_attempts"] = curr_attempts + 1

    if payload.assigned_to is not None:
        update_fields["assigned_to"] = payload.assigned_to
        update_fields["assigned_at"] = now_iso

    if not update_fields:
        return order_data

    try:
        from db_resilience import safe_update
        res = safe_update("orders", update_fields, "id", order_id, supabase)
        if res and res.data:
            return res.data[0]
    except Exception:
        pass

    res = supabase.table("orders").update(update_fields).eq("id", order_id).execute()
    return res.data[0] if (res and res.data) else {**order_data, **update_fields}



