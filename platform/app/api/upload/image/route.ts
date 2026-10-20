import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getAuthUser, verifyStoreOwner } from "@/lib/api-auth";
import { uploadImageFile, deleteFromCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ detail: "Non authentifié" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const storeId = formData.get("store_id") as string | null;

    if (!file) {
      return NextResponse.json({ detail: "Fichier manquant" }, { status: 400 });
    }

    if (!storeId) {
      return NextResponse.json({ detail: "store_id manquant" }, { status: 400 });
    }

    const admin = getAdminClient();
    const check = await verifyStoreOwner(storeId, user.id, admin);
    if (!check.ok) {
      return NextResponse.json({ detail: check.message }, { status: check.status });
    }

    const folder = `marchand/${storeId}/products`;
    const result = await uploadImageFile(file, folder, storeId);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("POST /api/upload/image error:", err);
    return NextResponse.json({ detail: err.message || "Erreur lors de l'upload" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ detail: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get("public_id");

    if (!publicId) {
      return NextResponse.json({ detail: "public_id manquant" }, { status: 400 });
    }

    // Sécurité IDOR : n'autoriser la suppression que dans le dossier 'marchand/'
    // et vérifier que la boutique appartient bien à l'utilisateur connecté.
    if (!publicId.startsWith("marchand/")) {
      return NextResponse.json({ detail: "Accès refusé" }, { status: 403 });
    }

    const parts = publicId.split("/");
    if (parts.length < 3 || !parts[1]) {
      return NextResponse.json({ detail: "public_id invalide" }, { status: 400 });
    }

    const storeId = parts[1];
    const admin = getAdminClient();
    const check = await verifyStoreOwner(storeId, user.id, admin);
    if (!check.ok) {
      return NextResponse.json({ detail: check.message }, { status: check.status });
    }

    const res = await deleteFromCloudinary(publicId);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Erreur lors de la suppression" }, { status: 500 });
  }
}

