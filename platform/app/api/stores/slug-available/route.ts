import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getAuthUser } from "@/lib/api-auth";
import {
  normalizeSlug,
  isSlugReserved,
  validateSlugFormat,
  checkBrandBlocklist,
} from "@/lib/slug-utils";

// Limiteur de débit glissant en mémoire (60 req / min par utilisateur)
const userRequests = new Map<string, number[]>();

function checkRateLimit(userId: string, maxRequests = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = (userRequests.get(userId) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxRequests) {
    userRequests.set(userId, timestamps);
    return false;
  }
  timestamps.push(now);
  userRequests.set(userId, timestamps);
  return true;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ detail: "Non authentifié" }, { status: 401 });
    }

    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { detail: "Trop de vérifications. Veuillez patienter un instant." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const slugParam = (searchParams.get("slug") || "").trim();
    const storeType = (searchParams.get("store_type") || "boutique").toLowerCase();

    if (!slugParam) {
      return NextResponse.json(
        { detail: "Le paramètre slug est requis" },
        { status: 400 }
      );
    }

    const rawSlug = slugParam.toLowerCase();
    const normalized = normalizeSlug(slugParam, storeType);

    // 1. Validation de format
    const { isValid, reason } = validateSlugFormat(rawSlug);
    if (!isValid) {
      return NextResponse.json({
        status: "invalid",
        normalized,
        suggestions: [],
        reason,
      });
    }

    // 2. Vérification marque protégée ou mot réservé
    const brandCheck = checkBrandBlocklist(rawSlug);
    if (brandCheck.isBlocked) {
      return NextResponse.json({
        status: "reserved",
        normalized,
        suggestions: [],
        reason: brandCheck.reason,
      });
    }

    if (isSlugReserved(rawSlug)) {
      return NextResponse.json({
        status: "reserved",
        normalized,
        suggestions: [],
        reason: "Cette adresse est réservée par le système EasyTrade.",
      });
    }

    // 3. Vérification unicité en base (insensible à la casse)
    const admin = getAdminClient();
    const { data: existing, error } = await admin
      .from("stores")
      .select("id")
      .ilike("slug", rawSlug)
      .maybeSingle();

    if (error) {
      console.error("slug-available DB error:", error);
      return NextResponse.json({ detail: error.message }, { status: 500 });
    }

    if (existing) {
      // Générer 2 suggestions disponibles
      const suggestions: string[] = [];
      const candidateBases = [
        `${rawSlug}-shop`,
        `${rawSlug}-1`,
        `${rawSlug}-dz`,
        `${rawSlug}-store`,
        `${rawSlug}-2`,
      ];

      for (const cand of candidateBases) {
        if (isSlugReserved(cand)) continue;
        const candValid = validateSlugFormat(cand);
        if (!candValid.isValid) continue;

        const { data: chk } = await admin
          .from("stores")
          .select("id")
          .ilike("slug", cand)
          .maybeSingle();

        if (!chk) {
          suggestions.push(cand);
          if (suggestions.length >= 2) break;
        }
      }

      return NextResponse.json({
        status: "taken",
        normalized,
        suggestions,
        reason: "Cette adresse est déjà utilisée par une autre boutique.",
      });
    }

    return NextResponse.json({
      status: "available",
      normalized: rawSlug,
      suggestions: [],
      reason: null,
    });
  } catch (err: any) {
    console.error("GET /api/stores/slug-available error:", err);
    return NextResponse.json(
      { detail: err.message || "Erreur interne" },
      { status: 500 }
    );
  }
}
