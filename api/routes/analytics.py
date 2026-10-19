"""
Routes analytics — /analytics

GET  /analytics/{store_id}?period=7d   — Dashboard data agrégé
POST /analytics/track                   — Tracking event (non-bloquant)
GET  /analytics/{store_id}/export       — Export CSV
"""

from __future__ import annotations

import csv
import io
import logging
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from dependencies import get_current_user, get_supabase_client

logger = logging.getLogger("storegen.analytics")
router = APIRouter(prefix="/analytics", tags=["Analytics"])

# ─── Types ────────────────────────────────────────────────────────────────────

Period = Literal["today", "7d", "30d", "3m"]

PERIOD_DAYS: dict[str, int] = {
    "today": 1,
    "7d":    7,
    "30d":   30,
    "3m":    90,
}

# ─── Tracking model ───────────────────────────────────────────────────────────

class TrackEvent(BaseModel):
    store_id:   str
    event_type: Literal["view", "whatsapp_click", "product_view", "order"]
    product_id: str | None = None
    source:     str | None = "direct"
    metadata:   dict      = Field(default_factory=dict)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def period_range(period: Period) -> tuple[datetime, datetime, datetime]:
    """Returns (start, end, prev_start) in UTC."""
    now   = datetime.now(timezone.utc)
    days  = PERIOD_DAYS[period]
    end   = now
    start = now - timedelta(days=days)
    prev  = start - timedelta(days=days)
    return start, end, prev


async def verify_store_owner(store_id: str, user_id: str, sb) -> None:
    res = sb.table("stores").select("owner_id").eq("id", store_id).single().execute()
    if not res.data or res.data["owner_id"] != user_id:
        raise HTTPException(403, "Accès refusé")


# ─── Fuseau horaire Algérie & dates ───────────────────────────────────────────
ALGIERS_TZ = timezone(timedelta(hours=1))


def _to_algiers_day(created_at_val: str) -> str:
    """Convertit un timestamp ISO Supabase en date calendrier YYYY-MM-DD (fuseau Algérie UTC+1)."""
    try:
        clean = str(created_at_val).strip().replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(ALGIERS_TZ).strftime("%Y-%m-%d")
    except Exception:
        return str(created_at_val)[:10]


def _format_amount(val: float) -> str:
    """Formate un montant en chaîne lisible, ex: 12 500 ou 12.5k."""
    if val >= 1_000_000:
        return f"{val / 1_000_000:.1f}M".replace(".0M", "M")
    if val >= 10_000:
        return f"{int(round(val)):,}".replace(",", " ")
    return f"{int(round(val))}"


# ─── GET /analytics/compare (Funnels Battle) ──────────────────────────────────

@router.get("/compare")
async def compare_funnels(
    period: str = Query("7d"),
    from_date: str | None = Query(None, alias="from"),
    to_date: str | None = Query(None, alias="to"),
    store_ids: str | None = Query(None),
    user=Depends(get_current_user),
    sb=Depends(get_supabase_client),
):
    """
    Comparateur multi-funnels (Funnels Battle) :
    - Restreint aux comptes Pro et Business (403 PlanLimitException sinon).
    - Maximum 5 funnels appartenant au marchand.
    - Filtre strictement sur type='funnel' et exclut brouillons et suspendus.
    - Le calcul du CA est STRICTEMENT basé sur les commandes livrées (status = 'delivered').
    - IMPORTANT : Le filtrage temporel s'applique strictement sur orders.created_at
      (date de création de la commande), et non sur les dates de mise à jour de statut.
    """
    from plan_guard import check_can_compare_funnels

    # 1. Garde de plan : vérifie que l'utilisateur a un plan actif Pro ou Business (refus par défaut, 403)
    check_can_compare_funnels(user.id, sb)

    # 2. Récupère tous les funnels éligibles du marchand (sans révéler les funnels des tiers)
    stores_res = (
        sb.table("stores")
        .select("id, name, slug, status, type, primary_color, created_at")
        .eq("owner_id", user.id)
        .eq("type", "funnel")
        .neq("status", "draft")
        .neq("status", "suspended")
        .order("created_at", desc=False)
        .execute()
    )
    all_funnels: list[dict] = stores_res.data or []

    # Map par id pour validation d'appartenance stricte
    funnels_by_id = {f["id"]: f for f in all_funnels}

    # 3. Sélection des funnels à comparer (max 5)
    selected_funnels: list[dict] = []
    if store_ids:
        raw_ids = [s.strip() for s in store_ids.split(",") if s.strip()]
        seen = set()
        for sid in raw_ids:
            if sid in funnels_by_id and sid not in seen:
                seen.add(sid)
                selected_funnels.append(funnels_by_id[sid])
            if len(selected_funnels) >= 5:
                break
    else:
        # Par défaut, jusqu'à 5 funnels actifs du marchand
        selected_funnels = all_funnels[:5]

    # 4. Calcul de la plage de dates (fuseau horaire Algérie UTC+1)
    now_algiers = datetime.now(ALGIERS_TZ)
    if from_date and to_date:
        try:
            start_dt = datetime.strptime(from_date[:10], "%Y-%m-%d").replace(
                hour=0, minute=0, second=0, microsecond=0, tzinfo=ALGIERS_TZ
            )
            end_dt = datetime.strptime(to_date[:10], "%Y-%m-%d").replace(
                hour=23, minute=59, second=59, microsecond=999999, tzinfo=ALGIERS_TZ
            )
            period_label = "custom"
        except Exception:
            start_dt = (now_algiers - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
            end_dt = now_algiers
            period_label = "7d"
    else:
        days = PERIOD_DAYS.get(period, 7)
        period_label = period
        if period == "today":
            start_dt = now_algiers.replace(hour=0, minute=0, second=0, microsecond=0)
            end_dt = now_algiers
        else:
            start_dt = (now_algiers - timedelta(days=days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)
            end_dt = now_algiers

    start_utc_iso = start_dt.astimezone(timezone.utc).isoformat()
    end_utc_iso = end_dt.astimezone(timezone.utc).isoformat()

    available_list = [
        {"id": f["id"], "name": f["name"], "slug": f["slug"], "status": f["status"]}
        for f in all_funnels
    ]

    # État vide : marchand avec moins de 2 funnels éligibles
    if len(all_funnels) < 2 or len(selected_funnels) < 2:
        return {
            "has_enough_funnels": False,
            "total_available_funnels": len(all_funnels),
            "available_funnels": available_list,
            "selected_funnel_ids": [f["id"] for f in selected_funnels],
            "funnels": [],
            "winner": None,
            "has_winner": False,
            "synthesis": "Sélectionnez au moins 2 funnels pour lancer la battle.",
            "daily_series": [],
            "period": {
                "key": period_label,
                "from": start_dt.strftime("%Y-%m-%d"),
                "to": end_dt.strftime("%Y-%m-%d"),
            },
        }

    target_ids = [f["id"] for f in selected_funnels]

    # 5. Deux requêtes groupées sans N+1
    events_res = (
        sb.table("store_analytics")
        .select("store_id, event_type, created_at")
        .in_("store_id", target_ids)
        .gte("created_at", start_utc_iso)
        .lte("created_at", end_utc_iso)
        .limit(20000)
        .execute()
    )
    events: list[dict] = events_res.data or []

    # IMPORTANT : Le filtrage de période s'applique strictement sur orders.created_at (date de commande),
    # et non sur une éventuelle date de mise à jour du statut.
    orders_res = (
        sb.table("orders")
        .select("id, store_id, total_amount, status, created_at")
        .in_("store_id", target_ids)
        .gte("created_at", start_utc_iso)
        .lte("created_at", end_utc_iso)
        .limit(10000)
        .execute()
    )
    orders: list[dict] = orders_res.data or []

    # 6. Agrégation par funnel
    cancelled_statuses = {"cancelled", "canceled", "annule", "annulée"}
    funnel_metrics: list[dict] = []

    for f in selected_funnels:
        fid = f["id"]
        f_events = [e for e in events if e.get("store_id") == fid]
        f_orders = [o for o in orders if o.get("store_id") == fid]

        views = sum(1 for e in f_events if e.get("event_type") == "view")
        wa_clicks = sum(1 for e in f_events if e.get("event_type") == "whatsapp_click")

        # Commandes non annulées
        non_cancelled = [
            o for o in f_orders
            if str(o.get("status") or "").lower() not in cancelled_statuses
        ]
        orders_count = len(non_cancelled)

        # Commandes livrées (seul critère de CA pris en compte pour le classement)
        delivered_orders = [
            o for o in f_orders
            if str(o.get("status") or "").lower() == "delivered"
        ]
        delivered_orders_count = len(delivered_orders)
        delivered_revenue = sum(float(o.get("total_amount") or 0.0) for o in delivered_orders)

        # Commandes en attente (confirmées + expédiées, grisées, exclues du classement)
        pending_orders = [
            o for o in f_orders
            if str(o.get("status") or "").lower() in ("confirmed", "shipped")
        ]
        pending_orders_count = len(pending_orders)
        pending_revenue = sum(float(o.get("total_amount") or 0.0) for o in pending_orders)

        # Ratios
        order_rate = round((orders_count / views) * 100, 1) if views > 0 else 0.0
        conversion_rate = round((wa_clicks / views) * 100, 1) if views > 0 else 0.0
        revenue_per_visit = round(delivered_revenue / views, 2) if views > 0 else 0.0
        aov = round(delivered_revenue / delivered_orders_count, 2) if delivered_orders_count > 0 else 0.0

        funnel_metrics.append({
            "id": fid,
            "name": f["name"],
            "slug": f["slug"],
            "primary_color": f.get("primary_color") or "#2540EA",
            "views": views,
            "whatsapp_clicks": wa_clicks,
            "orders_count": orders_count,
            "delivered_orders_count": delivered_orders_count,
            "delivered_revenue": delivered_revenue,
            "pending_revenue": pending_revenue,
            "pending_orders_count": pending_orders_count,
            "order_rate": order_rate,
            "conversion_rate": conversion_rate,
            "revenue_per_visit": revenue_per_visit,
            "aov": aov,
            "is_low_sample": views < 30,
            "is_winner": False,
            "is_most_efficient": False,
            "rank": 1,
        })

    # 7. Tri par CA livré décroissant et gestion des ex æquo
    funnel_metrics.sort(key=lambda m: m["delivered_revenue"], reverse=True)

    current_rank = 1
    for i, m in enumerate(funnel_metrics):
        if i > 0 and m["delivered_revenue"] < funnel_metrics[i - 1]["delivered_revenue"]:
            current_rank = i + 1
        m["rank"] = current_rank

    # 8. Vainqueur et efficacité
    has_delivered_revenue = any(m["delivered_revenue"] > 0 for m in funnel_metrics)
    has_winner = False
    winner = None

    if has_delivered_revenue:
        has_winner = True
        top_rev = funnel_metrics[0]["delivered_revenue"]
        for m in funnel_metrics:
            if m["delivered_revenue"] == top_rev:
                m["is_winner"] = True
        winner = funnel_metrics[0]

    # Badge 'Plus efficace' (uniquement si au moins 30 visites pour éviter les faux positifs)
    eligible_efficiency = [m for m in funnel_metrics if not m["is_low_sample"]]
    if eligible_efficiency:
        best_efficient = max(eligible_efficiency, key=lambda m: m["conversion_rate"])
        if best_efficient["conversion_rate"] > 0:
            best_efficient["is_most_efficient"] = True

    # 9. Phrase de synthèse protégée
    first = funnel_metrics[0]
    second = funnel_metrics[1] if len(funnel_metrics) > 1 else None

    if not has_delivered_revenue:
        synthesis = "Aucun vainqueur sur cette période : aucune commande livrée n'a été enregistrée pour les funnels sélectionnés."
    elif second and second["delivered_revenue"] == 0:
        # Protégé contre division par zéro
        synthesis = (
            f"« {first['name']} » est en tête avec {_format_amount(first['delivered_revenue'])} DZD livrés. "
            "C'est le seul funnel à avoir généré du CA livré sur cette période."
        )
    elif second and first["delivered_revenue"] == second["delivered_revenue"]:
        synthesis = (
            f"Égalité parfaite en tête entre « {first['name']} » et « {second['name']} » avec "
            f"{_format_amount(first['delivered_revenue'])} DZD livrés chacun !"
        )
    elif second and second["delivered_revenue"] > 0:
        diff = first["delivered_revenue"] - second["delivered_revenue"]
        pct = round((diff / second["delivered_revenue"]) * 100, 1)
        synthesis = (
            f"« {first['name']} » domine la battle avec {_format_amount(first['delivered_revenue'])} DZD de CA livré "
            f"(+{pct}% par rapport à « {second['name']} »)."
        )
    else:
        synthesis = f"« {first['name']} » est en tête avec {_format_amount(first['delivered_revenue'])} DZD livrés."

    # 10. Série chronologique journalière pour le graphique Recharts
    views_by_day_store: dict[tuple[str, str], int] = {}
    rev_by_day_store: dict[tuple[str, str], float] = {}

    for e in events:
        if e.get("event_type") == "view" and e.get("created_at"):
            d = _to_algiers_day(e["created_at"])
            k = (d, e["store_id"])
            views_by_day_store[k] = views_by_day_store.get(k, 0) + 1

    for o in orders:
        if str(o.get("status") or "").lower() == "delivered" and o.get("created_at"):
            d = _to_algiers_day(o["created_at"])
            k = (d, o["store_id"])
            amt = float(o.get("total_amount") or 0.0)
            rev_by_day_store[k] = rev_by_day_store.get(k, 0.0) + amt

    daily_series: list[dict] = []
    curr = start_dt
    while curr.date() <= end_dt.date():
        day_str = curr.strftime("%Y-%m-%d")
        label = curr.strftime("%d/%m")
        point: dict = {
            "date": label,
            "full_date": day_str,
        }
        for f in selected_funnels:
            fid = f["id"]
            point[f"views_{fid}"] = views_by_day_store.get((day_str, fid), 0)
            point[f"revenue_{fid}"] = rev_by_day_store.get((day_str, fid), 0.0)
        daily_series.append(point)
        curr += timedelta(days=1)

    return {
        "has_enough_funnels": True,
        "total_available_funnels": len(all_funnels),
        "available_funnels": available_list,
        "selected_funnel_ids": target_ids,
        "funnels": funnel_metrics,
        "winner": winner,
        "has_winner": has_winner,
        "synthesis": synthesis,
        "daily_series": daily_series,
        "period": {
            "key": period_label,
            "from": start_dt.strftime("%Y-%m-%d"),
            "to": end_dt.strftime("%Y-%m-%d"),
        },
    }


# ─── GET /analytics/{store_id} ────────────────────────────────────────────────

@router.get("/{store_id}")
async def get_analytics(
    store_id: str,
    period: Period = Query("7d"),
    user=Depends(get_current_user),
    sb=Depends(get_supabase_client),
):
    await verify_store_owner(store_id, user.id, sb)

    start, end, prev_start = period_range(period)

    # ── 1. Events current period ──────────────────────────────────────────────
    events_res = (
        sb.table("store_analytics")
        .select("event_type, product_id, metadata, created_at")
        .eq("store_id", store_id)
        .gte("created_at", start.isoformat())
        .lte("created_at", end.isoformat())
        .execute()
    )
    events: list[dict] = events_res.data or []

    # ── 2. Events previous period ─────────────────────────────────────────────
    prev_res = (
        sb.table("store_analytics")
        .select("event_type")
        .eq("store_id", store_id)
        .gte("created_at", prev_start.isoformat())
        .lt("created_at", start.isoformat())
        .execute()
    )
    prev_events: list[dict] = prev_res.data or []

    # ── 3. Orders ─────────────────────────────────────────────────────────────
    orders_res = (
        sb.table("orders")
        .select("id, created_at, customer_name, items, total_amount, status")
        .eq("store_id", store_id)
        .gte("created_at", start.isoformat())
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    orders: list[dict] = orders_res.data or []

    # ── 4. Products (for name lookup) ─────────────────────────────────────────
    products_res = (
        sb.table("products")
        .select("id, name, images")
        .eq("store_id", store_id)
        .execute()
    )
    products_map: dict[str, dict] = {
        p["id"]: p for p in (products_res.data or [])
    }

    # ── 5. Aggregate KPIs ─────────────────────────────────────────────────────
    total_orders      = len(orders)
    delivered_orders  = sum(1 for o in orders if o.get("status") == "delivered")
    pure_confirmed    = sum(1 for o in orders if o.get("status") == "confirmed")
    confirmed_orders  = sum(1 for o in orders if o.get("status") in ("confirmed", "delivered"))
    returned_orders   = sum(1 for o in orders if str(o.get("status")).lower() in ("returned", "retour", "retourne"))
    cancelled_orders  = sum(1 for o in orders if str(o.get("status")).lower() in ("cancelled", "canceled", "annule", "annulée"))
    pending_orders    = sum(1 for o in orders if o.get("status") == "pending")

    valid_orders      = [o for o in orders if str(o.get("status")).lower() not in ("cancelled", "canceled", "returned", "retour")]
    total_sales       = sum(float(o.get("total_amount") or 0.0) for o in valid_orders)
    delivered_sales   = sum(float(o.get("total_amount") or 0.0) for o in orders if o.get("status") == "delivered")
    avg_order_value   = round(total_sales / len(valid_orders)) if valid_orders else 0

    views             = sum(1 for e in events if e["event_type"] == "view")
    wa_clicks         = sum(1 for e in events if e["event_type"] == "whatsapp_click")
    conversion_rate   = round(wa_clicks / views * 100, 1) if views > 0 else 0.0

    prev_views        = sum(1 for e in prev_events if e["event_type"] == "view")
    prev_wa           = sum(1 for e in prev_events if e["event_type"] == "whatsapp_click")
    prev_conversion   = round(prev_wa / prev_views * 100, 1) if prev_views > 0 else 0.0
    prev_confirmed    = 0

    # ── 6. Daily views ────────────────────────────────────────────────────────
    days = PERIOD_DAYS[period]
    daily_map: dict[str, int] = {}
    for e in events:
        if e["event_type"] == "view":
            day = e["created_at"][:10]
            daily_map[day] = daily_map.get(day, 0) + 1

    daily_views = []
    for i in range(days):
        day = (start + timedelta(days=i)).strftime("%Y-%m-%d")
        label = (start + timedelta(days=i)).strftime("%d/%m")
        daily_views.append({"date": label, "views": daily_map.get(day, 0)})

    # ── 7. Top products ───────────────────────────────────────────────────────
    product_view_counts: dict[str, int] = {}
    for e in events:
        if e["event_type"] == "product_view" and e.get("product_id"):
            pid = e["product_id"]
            product_view_counts[pid] = product_view_counts.get(pid, 0) + 1

    top_products = sorted(
        [
            {
                "product_id": pid,
                "name":       products_map.get(pid, {}).get("name", "Produit supprimé"),
                "views":      cnt,
                "image":      (products_map.get(pid, {}).get("images") or [None])[0],
            }
            for pid, cnt in product_view_counts.items()
        ],
        key=lambda x: x["views"],
        reverse=True,
    )[:8]

    # ── 8. Traffic sources ────────────────────────────────────────────────────
    source_map: dict[str, int] = {}
    for e in events:
        if e["event_type"] == "view":
            src = (e.get("metadata") or {}).get("source", "Direct")
            source_map[src] = source_map.get(src, 0) + 1

    # Ensure all 4 buckets exist
    for bucket in ("Direct", "WhatsApp", "Facebook", "Autre"):
        source_map.setdefault(bucket, 0)

    traffic_sources = [
        {"source": k, "count": v}
        for k, v in sorted(source_map.items(), key=lambda x: -x[1])
    ]

    # ── 9. Format orders ──────────────────────────────────────────────────────
    recent_orders = [
        {
            "id":            o["id"],
            "created_at":    o["created_at"],
            "customer_name": o.get("customer_name", "—"),
            "items":         _parse_items(o.get("items")),
            "total_amount":  o.get("total_amount", 0),
            "status":        o.get("status", "pending"),
        }
        for o in orders[:20]
    ]

    return {
        "store_id": store_id,
        "period":   period,
        "kpi": {
            "total_sales":              total_sales,
            "delivered_sales":          delivered_sales,
            "total_orders":             total_orders,
            "delivered_orders":         delivered_orders,
            "confirmed_orders":         confirmed_orders,
            "pure_confirmed_orders":    pure_confirmed,
            "returned_orders":          returned_orders,
            "cancelled_orders":         cancelled_orders,
            "pending_orders":           pending_orders,
            "avg_order_value":          avg_order_value,
            "views":                    views,
            "views_prev":               prev_views,
            "whatsapp_clicks":          wa_clicks,
            "whatsapp_clicks_prev":     prev_wa,
            "conversion_rate":          conversion_rate,
            "conversion_rate_prev":     prev_conversion,
            "confirmed_orders_prev":    prev_confirmed,
        },
        "daily_views":     daily_views,
        "top_products":    top_products,
        "traffic_sources": traffic_sources,
        "recent_orders":   recent_orders,
    }


# ─── POST /analytics/track ────────────────────────────────────────────────────

@router.post("/track")
async def track_event(
    event: TrackEvent,
    sb=Depends(get_supabase_client),
):
    """Non-blocking event tracking — called from store frontend with fetch keepalive."""
    try:
        sb.table("store_analytics").insert({
            "store_id":   event.store_id,
            "event_type": event.event_type,
            "product_id": event.product_id,
            "metadata":   {
                "source": event.source,
                **event.metadata,
            },
        }).execute()
    except Exception as exc:
        # Never block the client — just log
        logger.warning(f"Track event failed silently: {exc}")

    return {"ok": True}


# ─── GET /analytics/{store_id}/export ────────────────────────────────────────

@router.get("/{store_id}/export")
async def export_analytics_csv(
    store_id: str,
    period: Period = Query("30d"),
    user=Depends(get_current_user),
    sb=Depends(get_supabase_client),
):
    await verify_store_owner(store_id, user.id, sb)
    start, end, _ = period_range(period)

    orders_res = (
        sb.table("orders")
        .select("id, created_at, customer_name, customer_phone, items, total_amount, status")
        .eq("store_id", store_id)
        .gte("created_at", start.isoformat())
        .order("created_at", desc=True)
        .execute()
    )
    orders = orders_res.data or []

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Date", "Client", "Téléphone", "Produits", "Total (DZD)", "Statut"])

    for o in orders:
        items_str = " | ".join(
            f"{i.get('qty',1)}x {i.get('name','?')}" for i in _parse_items(o.get("items"))
        )
        writer.writerow([
            o["id"][:8],
            o["created_at"][:16].replace("T", " "),
            o.get("customer_name", ""),
            o.get("customer_phone", ""),
            items_str,
            o.get("total_amount", 0),
            o.get("status", ""),
        ])

    output.seek(0)
    filename = f"commandes_{store_id[:8]}_{period}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _parse_items(raw) -> list[dict]:
    """Normalize items — handles list[dict] or stringified JSON."""
    if not raw:
        return []
    if isinstance(raw, list):
        return [{"name": i.get("name", "?"), "qty": i.get("quantity", i.get("qty", 1))} for i in raw]
    if isinstance(raw, str):
        try:
            import json
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return [{"name": i.get("name", "?"), "qty": i.get("quantity", i.get("qty", 1))} for i in parsed]
        except Exception:
            pass
    return []
