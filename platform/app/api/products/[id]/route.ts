import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getAuthUser, safeUpdate } from "@/lib/api-auth";

async function verifyProductOwner(productId: string, userId: string, admin: any) {
  const { data: product, error } = await admin
    .from("products")
    .select("*, stores(owner_id)")
    .eq("id", productId)
    .maybeSingle();

  if (error || !product) {
    return { ok: false as const, status: 404, message: "Produit introuvable", product: null };
  }

  const storesData = product.stores;
  const storeOwnerId =
    Array.isArray(storesData) && storesData.length > 0
      ? storesData[0]?.owner_id
      : storesData?.owner_id;

  if (storeOwnerId !== userId) {
    return { ok: false as const, status: 403, message: "Accès refusé", product: null };
  }

  return { ok: true as const, status: 200, message: "OK", product };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ detail: "Non authentifié" }, { status: 401 });
    }

    const { id } = params;
    const admin = getAdminClient();
    const check = await verifyProductOwner(id, user.id, admin);
    if (!check.ok) {
      return NextResponse.json({ detail: check.message }, { status: check.status });
    }

    const body = await req.json();

    // Whitelist stricte correspondant UNIQUEMENT aux colonnes réelles de la table 'products'.
    // Bannit id et store_id (immuables) ainsi que tout champ virtuel absent du schéma SQL.
    const ALLOWED_PRODUCT_PATCH_FIELDS = [
      "name",
      "slug",
      "description",
      "price",
      "original_price",
      "category",
      "stock_quantity",
      "images",
      "options",
      "is_featured",
      "position",
      "status",
    ] as const;

    const filteredBody: Record<string, any> = {};
    for (const key of ALLOWED_PRODUCT_PATCH_FIELDS) {
      if (key in body && body[key] !== undefined) {
        filteredBody[key] = body[key];
      }
    }

    if (filteredBody.name && !filteredBody.slug) {
      filteredBody.slug = filteredBody.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    if (filteredBody.images && Array.isArray(filteredBody.images)) {
      filteredBody.images = filteredBody.images.map((img: any, idx: number) => {
        if (typeof img === "string") {
          return { url: img, public_id: `img_${Date.now()}_${idx}` };
        }
        return img;
      });
    }

    const { data: updated, error } = await safeUpdate("products", filteredBody, "id", id, admin);

    if (error) {
      console.error("Update product error:", error);
      return NextResponse.json({ detail: error.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PATCH /api/products/[id] exception:", err);
    return NextResponse.json({ detail: err.message || "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ detail: "Non authentifié" }, { status: 401 });
    }

    const { id } = params;
    const admin = getAdminClient();
    const check = await verifyProductOwner(id, user.id, admin);
    if (!check.ok) {
      return NextResponse.json({ detail: check.message }, { status: check.status });
    }

    const { error } = await admin.from("products").delete().eq("id", id);
    if (error) {
      console.error("Delete product error:", error);
      return NextResponse.json({ detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Produit supprimé avec succès" });
  } catch (err: any) {
    console.error("DELETE /api/products/[id] exception:", err);
    return NextResponse.json({ detail: err.message || "Erreur interne" }, { status: 500 });
  }
}
