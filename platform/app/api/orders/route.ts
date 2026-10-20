import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_WILAYAS } from "@/lib/wilayas";
import { normalizeDzPhone, isValidStrictDzPhone } from "@/lib/utils";
import { getAuthUser, safeUpdate } from "@/lib/api-auth";

export const dynamic = "force-dynamic";


function getSupabaseAdmin() {
  if ((globalThis as any).__mockSupabaseAdmin) {
    return (globalThis as any).__mockSupabaseAdmin;
  }
  const serviceKey =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

// Support CORS pour que les boutiques et funnels déployés sur Vercel puissent soumettre leurs commandes
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

const MIN_QTY_PER_ITEM = 1;
const MAX_QTY_PER_ITEM = 10;
const MAX_ITEMS_PER_ORDER = 10;

const orderIpLimiter = new Map<string, number[]>();
const MAX_ORDERS_PER_WINDOW = 20;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function checkIpRateLimit(ip: string): boolean {
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true;
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const timestamps = (orderIpLimiter.get(ip) || []).filter((t) => t > cutoff);
  if (timestamps.length >= MAX_ORDERS_PER_WINDOW) {
    return false;
  }
  timestamps.push(now);
  orderIpLimiter.set(ip, timestamps);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const firstIp = forwarded ? forwarded.split(",")[0]?.trim() : null;
    const clientIp = firstIp || req.headers.get("x-real-ip")?.trim() || "unknown";

    if (!checkIpRateLimit(clientIp)) {
      return NextResponse.json(
        { error: "Trop de commandes soumises depuis cette adresse. Veuillez patienter avant de réessayer." },
        { status: 429, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const supabase = getSupabaseAdmin();

    // 1. Validation stricte de la boutique
    const rawStoreId = body.store_id;
    if (!rawStoreId || typeof rawStoreId !== "string" || !rawStoreId.trim()) {
      return NextResponse.json(
        { error: "Identifiant de boutique (store_id) manquant pour cette commande" },
        { status: 400, headers: corsHeaders }
      );
    }
    const store_id = rawStoreId.trim();

    const { data: storeData } = await supabase
      .from("stores")
      .select("id, name, status, settings")
      .eq("id", store_id)
      .maybeSingle();

    if (!storeData) {
      return NextResponse.json(
        { error: "Boutique introuvable pour cette commande" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Exigence 2 : La boutique doit exister et être publiée ('published' ou 'active' dans les données historiques)
    if (storeData.status !== "published" && storeData.status !== "active") {
      return NextResponse.json(
        { error: "La boutique n'est pas disponible pour recevoir des commandes (statut non publié)" },
        { status: 400, headers: corsHeaders }
      );
    }
    if (storeData.status === "suspended") {
      return NextResponse.json(
        { error: "Cette boutique est actuellement suspendue" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 2. Validation minimale des champs client
    // Nom client : 2 à 80 caractères
    const rawName = typeof body.customer_name === "string" ? body.customer_name.trim() : "";
    if (rawName.length < 2 || rawName.length > 80) {
      return NextResponse.json(
        { error: "Le nom du client doit comporter entre 2 et 80 caractères" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Téléphone au format algérien (05, 06, 07 suivi de 8 chiffres, ou +213)
    const cleanPhone = normalizeDzPhone(body.customer_phone);
    if (!isValidStrictDzPhone(cleanPhone)) {
      return NextResponse.json(
        {
          error:
            "Numéro de téléphone algérien invalide. Il doit comporter 10 chiffres et commencer par 05, 06 ou 07 (ou format international +213).",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Mode de livraison (domicile ou stopdesk)
    const rawShipMode = String(body.ship_mode || body.shipMode || "").toLowerCase().trim();
    if (rawShipMode !== "domicile" && rawShipMode !== "stopdesk" && rawShipMode !== "stop-desk") {
      return NextResponse.json(
        { error: "Mode de livraison invalide. Choisissez 'domicile' ou 'stopdesk'." },
        { status: 400, headers: corsHeaders }
      );
    }
    const isHome = rawShipMode === "domicile";

    // Wilaya de livraison (1 à 58)
    const rawWilayaId = body.wilaya_id;
    const wilayaId = Number(rawWilayaId);
    if (!rawWilayaId || isNaN(wilayaId) || !Number.isInteger(wilayaId) || wilayaId < 1 || wilayaId > 58) {
      return NextResponse.json(
        { error: "Wilaya de livraison invalide ou inconnue (doit être un entier entre 1 et 58)." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Frais de livraison : lus dans shipping_rates de CETTE boutique
    let deliveryCost: number | null = null;
    let wilayaName = typeof body.wilaya === "string" ? body.wilaya.trim() : "";

    const { data: storeRate } = await supabase
      .from("shipping_rates")
      .select("price_home, price_desk")
      .eq("store_id", storeData.id)
      .eq("wilaya_id", wilayaId)
      .maybeSingle();

    if (storeRate) {
      deliveryCost = isHome ? Number(storeRate.price_home) : Number(storeRate.price_desk);
    } else {
      // Repli sur la table wilayas seulement s'il n'existe pas de ligne pour cette boutique
      const { data: globalWilaya } = await supabase
        .from("wilayas")
        .select("name, price_home, price_desk")
        .eq("id", wilayaId)
        .maybeSingle();

      if (globalWilaya) {
        wilayaName = wilayaName || globalWilaya.name;
        deliveryCost = isHome ? Number(globalWilaya.price_home) : Number(globalWilaya.price_desk);
      } else {
        const fallback = DEFAULT_WILAYAS.find((w) => w.id === wilayaId);
        if (fallback) {
          wilayaName = wilayaName || fallback.name;
          deliveryCost = isHome ? fallback.price_home : fallback.price_desk;
        }
      }
    }

    if (deliveryCost === null || isNaN(deliveryCost) || deliveryCost < 0) {
      return NextResponse.json(
        { error: "Tarif de livraison introuvable pour cette wilaya." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Adresse : 5 à 300 caractères
    const customerCommune =
      typeof body.customer_commune === "string"
        ? body.customer_commune.trim()
        : typeof body.commune === "string"
        ? body.commune.trim()
        : "";
    const rawAddress = typeof body.customer_address === "string" ? body.customer_address.trim() : "";
    let fullAddress = rawAddress;
    if (!fullAddress) {
      const modeLabel = isHome ? "À domicile" : "Stop Desk";
      const parts: string[] = [];
      if (wilayaName) parts.push(`Wilaya: ${wilayaName} (${modeLabel})`);
      if (customerCommune) parts.push(`Commune: ${customerCommune}`);
      fullAddress = parts.join(" — ");
    }
    if (fullAddress.length < 5 || fullAddress.length > 300) {
      return NextResponse.json(
        { error: "L'adresse de livraison doit comporter entre 5 et 300 caractères." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Notes : 500 caractères maximum
    const rawNotes = typeof body.notes === "string" ? body.notes.trim() : "";
    if (rawNotes.length > 500) {
      return NextResponse.json(
        { error: "La note de commande ne doit pas dépasser 500 caractères." },
        { status: 400, headers: corsHeaders }
      );
    }
    const cleanNotes = rawNotes.length > 0 ? rawNotes : null;

    // 3. Articles de la commande et recalcul strict des prix en base
    let rawItems: any[] = [];
    if (Array.isArray(body.items) && body.items.length > 0) {
      rawItems = body.items;
    } else if (body.product_id) {
      rawItems = [
        {
          product_id: body.product_id,
          qty: body.qty !== undefined ? body.qty : 1,
          options_selected: body.options_selected || {},
        },
      ];
    }

    if (rawItems.length === 0) {
      return NextResponse.json(
        { error: "La commande doit contenir au moins un article." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (rawItems.length > MAX_ITEMS_PER_ORDER) {
      return NextResponse.json(
        { error: `Une commande ne peut pas contenir plus de ${MAX_ITEMS_PER_ORDER} articles.` },
        { status: 400, headers: corsHeaders }
      );
    }

    const validatedItems = [];
    let subtotal = 0;

    for (const rawItem of rawItems) {
      const prodId = rawItem.product_id || rawItem.id;
      if (!prodId || typeof prodId !== "string" || !prodId.trim()) {
        return NextResponse.json(
          { error: "Identifiant de produit manquant pour un article de la commande." },
          { status: 400, headers: corsHeaders }
        );
      }

      const rawQty = rawItem.qty !== undefined ? rawItem.qty : rawItem.quantity;
      if (
        typeof rawQty !== "number" ||
        !Number.isInteger(rawQty) ||
        rawQty < MIN_QTY_PER_ITEM ||
        rawQty > MAX_QTY_PER_ITEM
      ) {
        return NextResponse.json(
          {
            error: `La quantité de chaque article doit être un entier compris entre ${MIN_QTY_PER_ITEM} et ${MAX_QTY_PER_ITEM}.`,
          },
          { status: 400, headers: corsHeaders }
        );
      }

      // Récupération du produit en base
      const { data: dbProduct, error: prodErr } = await supabase
        .from("products")
        .select("id, name, price, status, store_id, images, options")
        .eq("id", prodId.trim())
        .maybeSingle();

      if (prodErr || !dbProduct) {
        return NextResponse.json(
          { error: "Produit introuvable en base de données." },
          { status: 400, headers: corsHeaders }
        );
      }

      if (dbProduct.store_id !== storeData.id) {
        return NextResponse.json(
          { error: "Le produit spécifié n'appartient pas à cette boutique." },
          { status: 400, headers: corsHeaders }
        );
      }

      if (dbProduct.status !== "active") {
        return NextResponse.json(
          { error: "Le produit spécifié n'est pas actif." },
          { status: 400, headers: corsHeaders }
        );
      }

      const dbPrice = Number(dbProduct.price);
      if (isNaN(dbPrice) || dbPrice < 0) {
        return NextResponse.json(
          { error: "Prix de produit invalide en base." },
          { status: 400, headers: corsHeaders }
        );
      }

      // Le serveur ignore tout prix envoyé par le client (items[].price)
      subtotal += dbPrice * rawQty;

      validatedItems.push({
        product_id: dbProduct.id,
        name: dbProduct.name,
        price: dbPrice,
        quantity: rawQty,
        options_selected: rawItem.options_selected || {},
        image: Array.isArray(dbProduct.images) && dbProduct.images.length > 0 ? dbProduct.images[0] : null,
      });
    }

    // Montant total recalculé côté serveur (le total_amount envoyé par le client est ignoré)
    const totalAmount = Math.round((subtotal + deliveryCost) * 100) / 100;

    // Insertion de la commande en base avec clé service_role (bypasse RLS)
    const payload = {
      store_id: storeData.id,
      customer_name: rawName,
      customer_phone: cleanPhone,
      customer_email: body.customer_email || null,
      customer_address: fullAddress,
      items: validatedItems,
      total_amount: totalAmount,
      status: "pending",
      payment_status: "pending",
      notes: cleanNotes,
    };

    const { data: createdOrder, error: insertError } = await supabase
      .from("orders")
      .insert(payload)
      .select()
      .single();

    if (insertError || !createdOrder) {
      console.error("Erreur insertion commande:", insertError);
      return NextResponse.json(
        { error: "Impossible d'enregistrer la commande", details: insertError?.message },
        { status: 500, headers: corsHeaders }
      );
    }

    // 7b. Smart Dispatch Call Center (Global : Boutiques & Funnels)
    try {
      const { assignOrderSmartly } = await import("@/lib/dispatcher");
      const dispatchRes = await assignOrderSmartly(createdOrder.id, store_id, supabase);
      if (dispatchRes?.success && dispatchRes.assigned_to) {
        createdOrder.assigned_to = dispatchRes.assigned_to;
        createdOrder.assigned_at = dispatchRes.assigned_at;
      }
    } catch (dispatchErr) {
      console.warn("SmartDispatch non-bloquant:", dispatchErr);
    }

    // 8. Déduction du stock (non-bloquante)
    try {
      for (const item of validatedItems) {
        const prodId = item.product_id;
        const q = item.quantity;
        if (prodId) {
          const { data: pData } = await supabase
            .from("products")
            .select("stock_quantity")
            .eq("id", prodId)
            .single();

          if (pData && pData.stock_quantity !== null && pData.stock_quantity !== undefined) {
            await supabase
              .from("products")
              .update({ stock_quantity: Math.max(0, pData.stock_quantity - q) })
              .eq("id", prodId);
          }
        }
      }
    } catch (e) {
      console.warn("Déduction stock non bloquante:", e);
    }

    // 9. Alerte Telegram instantanée (non-bloquante)
    try {
      const storeSettings = (storeData.settings as any) || {};
      const telegramChatId = storeSettings?.notifications?.telegram_chat_id?.trim();
      const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
      if (telegramChatId && botToken) {
        const itemsList = Array.isArray(validatedItems) ? validatedItems : [];
        const itemsStr =
          itemsList
            .map(
              (it: any) =>
                `  • ${it.name || "Article"} × ${it.quantity || 1} (${Number(it.price || 0).toLocaleString("fr-DZ")} DZD)`
            )
            .join("\n") || "  • 1x Commande directe";
        const ref = String(createdOrder.id || "").slice(-6).toUpperCase();
        const text = [
          `🛍️ <b>Nouvelle commande reçue !</b>`,
          ``,
          `🏪 <b>Boutique :</b> ${storeData.name || "Boutique"}`,
          `🔖 <b>Réf :</b> #${ref}`,
          ``,
          `📦 <b>Articles :</b>\n${itemsStr}`,
          ``,
          `👤 <b>Client :</b> ${createdOrder.customer_name}`,
          `📞 <b>Téléphone :</b> <code>${createdOrder.customer_phone}</code>`,
          `📍 <b>Adresse / Wilaya :</b> ${createdOrder.customer_address || "Non spécifiée"}`,
          `💰 <b>Total C.O.D :</b> <b>${Number(totalAmount).toLocaleString("fr-DZ")} DZD</b>`,
          cleanNotes ? `📝 <b>Note :</b> ${cleanNotes}` : "",
        ]
          .filter(Boolean)
          .join("\n");

        // Envoi asynchrone fire-and-forget sans ralentir le retour HTTP
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text,
            parse_mode: "HTML",
          }),
        }).catch((err) => {
          console.warn("Échec alerte Telegram (non bloquant):", err?.message || err);
        });
      }
    } catch (e) {
      console.warn("Erreur préparation alerte Telegram:", e);
    }

    return NextResponse.json(
      {
        message: "Commande enregistrée avec succès",
        order_id: createdOrder.id,
        total_amount: totalAmount,
        subtotal: Math.round(subtotal * 100) / 100,
        shipping_fee: Math.round(deliveryCost * 100) / 100,
        order: createdOrder,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Erreur route /api/orders:", err);
    return NextResponse.json(
      { error: "Erreur serveur interne lors du traitement de la commande", details: err?.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ detail: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filterStoreId = searchParams.get("store_id");
    const filterStatus = searchParams.get("status");

    const supabase = getSupabaseAdmin();

    // 1. Boutiques de l'utilisateur comme propriétaire
    const { data: ownedStores } = await supabase
      .from("stores")
      .select("id, name, type, owner_id")
      .eq("owner_id", user.id);

    let accessibleStores = ownedStores || [];
    let userRole = "owner";
    let memberIds: string[] = [];

    // 2. Si pas propriétaire (ou pour vérifier l'appartenance à une équipe), vérifier store_members
    if (accessibleStores.length === 0) {
      const userEmail = (user.email || "").toLowerCase();
      const { data: memberships } = await supabase
        .from("store_members")
        .select("id, owner_id, store_id, role, status")
        .or(`user_id.eq.${user.id},email.eq.${userEmail},user_email.eq.${userEmail}`);

      const activeMemberships = (memberships || []).filter(
        (m: any) => m.is_active === true && m.status === "active"
      );

      memberIds = activeMemberships.map((m: any) => m.id).filter(Boolean);
      const ownerIds = Array.from(new Set(activeMemberships.map((m: any) => m.owner_id).filter(Boolean)));

      if (ownerIds.length > 0) {
        userRole = "member";
        const { data: teamStores } = await supabase
          .from("stores")
          .select("id, name, type, owner_id")
          .in("owner_id", ownerIds);
        accessibleStores = teamStores || [];
      } else if (activeMemberships.length > 0) {
        userRole = "member";
        const directStoreIds = activeMemberships.map((m: any) => m.store_id).filter(Boolean);
        if (directStoreIds.length > 0) {
          const { data: teamStores } = await supabase
            .from("stores")
            .select("id, name, type, owner_id")
            .in("id", directStoreIds);
          accessibleStores = teamStores || [];
        }
      }
    }

    if (accessibleStores.length === 0) {
      return NextResponse.json({ orders: [], count: 0, user_role: userRole });
    }

    const storeMap = new Map<string, any>(accessibleStores.map((s: any) => [s.id, s]));
    let allowedStoreIds = Array.from(storeMap.keys());

    if (filterStoreId && filterStoreId !== "all") {
      if (!allowedStoreIds.includes(filterStoreId)) {
        return NextResponse.json({ detail: "Accès refusé à cette boutique" }, { status: 403 });
      }
      allowedStoreIds = [filterStoreId];
    }

    let query = supabase
      .from("orders")
      .select("*")
      .in("store_id", allowedStoreIds)
      .order("created_at", { ascending: false });

    if (filterStatus && filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data: orders, error } = await query;
    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 500 });
    }

    const formattedOrders = (orders || []).map((o: any) => {
      const st = storeMap.get(o.store_id) || {};
      return {
        ...o,
        total: o.total ?? o.total_amount ?? 0,
        subtotal: o.subtotal ?? o.total_amount ?? 0,
        shipping_address: o.shipping_address ?? o.customer_address ?? null,
        store_name: st.name || "Boutique",
        store_type: st.type || "boutique",
      };
    });

    let finalOrders = formattedOrders;
    if (userRole === "member") {
      const allowedAssignees = new Set([user.id, ...memberIds].filter(Boolean));
      const userEmail = (user.email || "").toLowerCase().trim();
      finalOrders = formattedOrders.filter((o: any) => {
        // 1. Commande assignée à ce téléopérateur (via auth.uid() ou store_members.id ou email)
        const isAssignedToMe =
          (o.assigned_to && allowedAssignees.has(o.assigned_to)) ||
          (o.assigned_to_email && String(o.assigned_to_email).toLowerCase().trim() === userEmail);

        // 2. Commande non encore assignée (en attente dans le pool de l'équipe du propriétaire)
        const isUnassignedPending = !o.assigned_to && o.status === "pending";

        return isAssignedToMe || isUnassignedPending;
      });
    }

    return NextResponse.json({
      orders: finalOrders,
      count: finalOrders.length,
      user_role: userRole,
    });
  } catch (err: any) {
    console.error("GET /api/orders error:", err);
    return NextResponse.json({ detail: err?.message || "Erreur interne" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ detail: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const orderId = body.id || body.order_id;
    if (!orderId) {
      return NextResponse.json({ detail: "ID de commande manquant" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*, stores(id, name, type, owner_id)")
      .eq("id", orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ detail: "Commande introuvable" }, { status: 404 });
    }

    // Vérifier l'accès (Propriétaire ou membre de l'équipe du propriétaire)
    const storeData = order.stores as any;
    const ownerId = storeData?.owner_id;
    const isOwner = ownerId === user.id;
    let isMember = false;

    if (!isOwner && ownerId) {
      const userEmail = (user.email || "").toLowerCase();
      const { data: memberRows } = await supabase
        .from("store_members")
        .select("id, status")
        .or(`owner_id.eq.${ownerId},store_id.eq.${order.store_id}`)
        .or(`user_id.eq.${user.id},email.eq.${userEmail},user_email.eq.${userEmail}`);

      const active = (memberRows || []).filter(
        (m: any) => m.status === "active" || m.status === "invited" || !m.status
      );
      if (active.length > 0) {
        isMember = true;
      }
    }

    if (!isOwner && !isMember) {
      return NextResponse.json({ detail: "Accès refusé à cette commande" }, { status: 403 });
    }

    const updatePayload: Record<string, any> = {};
    const nowIso = new Date().toISOString();

    if (body.status) {
      updatePayload.status = body.status;
      if (body.status === "confirmed") {
        updatePayload.confirmed_by = user.id;
        updatePayload.confirmed_at = nowIso;
      }
    }

    if (body.payment_status) {
      updatePayload.payment_status = body.payment_status;
    }

    if (body.notes !== undefined) {
      updatePayload.notes = body.notes;
    }

    if (body.agent_notes !== undefined) {
      updatePayload.agent_notes = body.agent_notes;
    }

    if (body.cancel_reason !== undefined) {
      updatePayload.cancel_reason = body.cancel_reason;
    }

    if (body.call_attempts !== undefined) {
      updatePayload.call_attempts = Number(body.call_attempts);
    } else if (body.status === "no_answer" || body.status === "callback") {
      updatePayload.call_attempts = Number(order.call_attempts || 0) + 1;
    }

    if (body.assigned_to !== undefined) {
      updatePayload.assigned_to = body.assigned_to;
      updatePayload.assigned_at = nowIso;
    }

    const updateRes = await safeUpdate("orders", updatePayload, "id", orderId, supabase);
    if (updateRes.error) {
      return NextResponse.json({ detail: updateRes.error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        ...updatePayload,
        store_name: storeData?.name || "Boutique",
        store_type: storeData?.type || "boutique",
      },
    });
  } catch (err: any) {
    console.error("PATCH /api/orders error:", err);
    return NextResponse.json({ detail: err?.message || "Erreur interne" }, { status: 500 });
  }
}

