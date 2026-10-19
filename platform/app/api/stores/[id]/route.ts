import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminClient, getAuthUser, verifyStoreOwner, safeUpdate } from "@/lib/api-auth";

export async function GET(
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
    const check = await verifyStoreOwner(id, user.id, admin);
    if (!check.ok) {
      return NextResponse.json({ detail: check.message }, { status: check.status });
    }

    return NextResponse.json(check.store);
  } catch (err: any) {
    console.error("GET /api/stores/[id] exception:", err);
    return NextResponse.json({ detail: err.message || "Erreur interne" }, { status: 500 });
  }
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
    const check = await verifyStoreOwner(id, user.id, admin);
    if (!check.ok) {
      return NextResponse.json({ detail: check.message }, { status: check.status });
    }

    const body = await req.json();

    // ── Whitelist stricte des champs modifiables ────────────────────────────
    // Bannit formellement la modification de slug, owner_id, id, status,
    // published_url, vercel_project_id, github_repo, subdomain, generated_html
    const ALLOWED_STORE_PATCH_FIELDS = [
      "name",
      "category",
      "description",
      "slogan",
      "currency",
      "city",
      "country",
      "primary_color",
      "font_family",
      "logo_url",
      "whatsapp_phone",
      "theme",
      "animation_style",
      "special_effects",
      "type",
      "seo_title",
      "seo_description",
      "seo_metadata",
      "custom_domain",
      "facebook_pixel_id",
      "tiktok_pixel_id",
      "google_analytics_id",
      "payment_settings",
      "settings",
      "content_overrides",
    ] as const;

    const filteredBody: Record<string, any> = {};
    for (const key of ALLOWED_STORE_PATCH_FIELDS) {
      if (key in body && body[key] !== undefined) {
        filteredBody[key] = body[key];
      }
    }

    // Protection plan pour domaine personnalisé
    if (filteredBody.custom_domain && typeof filteredBody.custom_domain === "string" && filteredBody.custom_domain.trim()) {
      const { getUserPlan } = await import("@/lib/plan-limits-server");
      const userPlan = await getUserPlan(user.id, admin);
      if (!userPlan.canUseCustomDomain) {
        return NextResponse.json(
          {
            detail: "PLAN_LIMIT_REACHED",
            code: "PLAN_LIMIT_REACHED",
            message:
              "La connexion d'un nom de domaine personnalisé (.com, .dz) est réservée aux forfaits Pro et Business. Passez au Pack Pro pour connecter votre propre domaine !",
            limit_type: "domain",
          },
          { status: 403 }
        );
      }
    }

    // Protection plan pour multi-pixels (TikTok & Google Analytics)
    if (
      (filteredBody.tiktok_pixel_id && typeof filteredBody.tiktok_pixel_id === "string" && filteredBody.tiktok_pixel_id.trim()) ||
      (filteredBody.google_analytics_id && typeof filteredBody.google_analytics_id === "string" && filteredBody.google_analytics_id.trim())
    ) {
      const { getUserPlan } = await import("@/lib/plan-limits-server");
      const userPlan = await getUserPlan(user.id, admin);
      if (userPlan.plan === "free") {
        return NextResponse.json(
          {
            detail: "PLAN_LIMIT_REACHED",
            code: "PLAN_LIMIT_REACHED",
            message:
              "Le tracking multi-pixels (TikTok Pixel & Google Analytics) est réservé aux forfaits Pro et Business. Passez au Pack Pro pour débloquer le multi-tracking !",
            limit_type: "pixels",
          },
          { status: 403 }
        );
      }
    }

    // If type is updated, keep seo_metadata in sync
    if (filteredBody.type && check.store) {
      const currentMeta = (typeof check.store.seo_metadata === "object" && check.store.seo_metadata !== null)
        ? { ...check.store.seo_metadata }
        : {};
      currentMeta.type = filteredBody.type;
      filteredBody.seo_metadata = filteredBody.seo_metadata
        ? { ...filteredBody.seo_metadata, type: filteredBody.type }
        : currentMeta;
    }

    const { data: updated, error } = await safeUpdate("stores", filteredBody, "id", id, admin);

    if (error) {
      console.error("Update store error:", error);
      return NextResponse.json({ detail: error.message }, { status: 500 });
    }

    if (updated?.slug) {
      try {
        revalidatePath(`/${updated.slug}`);
        revalidatePath(`/${updated.slug}/[product]`, "page");
      } catch (e) {
        // Cache revalidation failure ignored
      }
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PATCH /api/stores/[id] exception:", err);
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
    const check = await verifyStoreOwner(id, user.id, admin);
    if (!check.ok) {
      return NextResponse.json({ detail: check.message }, { status: check.status });
    }

    const { error } = await admin.from("stores").delete().eq("id", id);
    if (error) {
      console.error("Delete store error:", error);
      return NextResponse.json({ detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Boutique supprimée avec succès" });
  } catch (err: any) {
    console.error("DELETE /api/stores/[id] exception:", err);
    return NextResponse.json({ detail: err.message || "Erreur interne" }, { status: 500 });
  }
}
