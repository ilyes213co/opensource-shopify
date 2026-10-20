import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getAuthUser } from "@/lib/api-auth";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ detail: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const productIds: string[] = body.product_ids || [];

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ detail: "product_ids ne peut pas être vide" }, { status: 400 });
    }

    const admin = getAdminClient();

    // Verify all products belong to the authenticated user's stores
    const { data: userProducts, error: pErr } = await admin
      .from("products")
      .select("id, stores!inner(owner_id)")
      .in("id", productIds)
      .eq("stores.owner_id", user.id);

    if (pErr || !userProducts || userProducts.length !== productIds.length) {
      return NextResponse.json({ detail: "Accès refusé à un ou plusieurs produits" }, { status: 403 });
    }

    // Update positions sequentially or in parallel
    await Promise.all(
      productIds.map((id, index) =>
        admin.from("products").update({ position: index }).eq("id", id)
      )
    );

    return NextResponse.json({ message: "Produits réordonnés avec succès" });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Erreur interne" }, { status: 500 });
  }
}
