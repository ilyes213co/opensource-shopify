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
      "cover_url",
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

    // Validation stricte et unicité de custom_domain
    if (filteredBody.custom_domain !== undefined) {
      if (typeof filteredBody.custom_domain === "string" && filteredBody.custom_domain.trim()) {
        const cleanDomain = filteredBody.custom_domain
          .trim()
          .toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/\/+$/, "");

        const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;
        if (!domainRegex.test(cleanDomain) || cleanDomain.length > 253) {
          return NextResponse.json(
            { detail: "Nom de domaine invalide. Utilisez un format tel que 'maboutique.com' ou 'shop.dz'." },
            { status: 400 }
          );
        }

        if (
          cleanDomain === "easytradez.site" ||
          cleanDomain.endsWith(".easytradez.site") ||
          cleanDomain === "vercel.app" ||
          cleanDomain.endsWith(".vercel.app") ||
          cleanDomain === "localhost"
        ) {
          return NextResponse.json(
            { detail: "Ce nom de domaine est réservé par la plateforme EasyTrade." },
            { status: 400 }
          );
        }

        // Protection plan pour domaine personnalisé
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

        // Vérification de l'unicité en base de données
        const { data: existingDomainStore } = await admin
          .from("stores")
          .select("id")
          .neq("id", id)
          .eq("custom_domain", cleanDomain)
          .limit(1);

        if (existingDomainStore && existingDomainStore.length > 0) {
          return NextResponse.json(
            { detail: "Ce nom de domaine personnalisé est déjà associé à une autre boutique." },
            { status: 400 }
          );
        }

        filteredBody.custom_domain = cleanDomain;
      } else {
        filteredBody.custom_domain = null;
      }
    }

    // Validation & limite de taille pour settings (max 50 Ko)
    if (filteredBody.settings !== undefined) {
      if (typeof filteredBody.settings !== "object" || filteredBody.settings === null || Array.isArray(filteredBody.settings)) {
        return NextResponse.json({ detail: "Le champ settings doit être un objet JSON valide." }, { status: 400 });
      }
      const rawSettingsJson = JSON.stringify(filteredBody.settings);
      if (rawSettingsJson.length > 50000) {
        return NextResponse.json({ detail: "Le champ settings dépasse la taille maximale autorisée (50 Ko)." }, { status: 400 });
      }
      const ALLOWED_SETTINGS_KEYS = new Set([
        "instagram_url",
        "facebook_page_url",
        "shipping_slip",
        "security",
        "carrier",
        "manual_shipping",
        "notifications",
        "custom_domain",
      ]);
      const sanitizedSettings: Record<string, any> = {};
      for (const [k, v] of Object.entries(filteredBody.settings)) {
        if (ALLOWED_SETTINGS_KEYS.has(k)) {
          sanitizedSettings[k] = v;
        }
      }
      filteredBody.settings = sanitizedSettings;
    }

    // Validation & limite de taille pour content_overrides (max 100 Ko)
    if (filteredBody.content_overrides !== undefined) {
      if (typeof filteredBody.content_overrides !== "object" || filteredBody.content_overrides === null || Array.isArray(filteredBody.content_overrides)) {
        return NextResponse.json({ detail: "Le champ content_overrides doit être un objet JSON valide." }, { status: 400 });
      }
      const rawOverridesJson = JSON.stringify(filteredBody.content_overrides);
      if (rawOverridesJson.length > 100000) {
        return NextResponse.json({ detail: "Le champ content_overrides dépasse la taille maximale autorisée (100 Ko)." }, { status: 400 });
      }
      const ALLOWED_OVERRIDES_KEYS = new Set([
        "hero",
        "notice_bar",
        "announcement",
        "theme_custom",
        "price",
        "badge",
        "cta",
        "faq",
        "testimonials",
        "payment_settings",
      ]);
      const sanitizedOverrides: Record<string, any> = {};
      for (const [k, v] of Object.entries(filteredBody.content_overrides)) {
        if (ALLOWED_OVERRIDES_KEYS.has(k) || typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null) {
          sanitizedOverrides[k] = v;
        }
      }
      filteredBody.content_overrides = sanitizedOverrides;
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
