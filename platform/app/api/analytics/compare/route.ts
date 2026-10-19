import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * Route proxy Next.js -> FastAPI pour Funnels Battle.
 * Respecte la règle d'une SEULE source de vérité pour le calcul :
 * - Vérifie la session Supabase de l'utilisateur
 * - Transmet directement la requête avec son jeton Bearer au backend FastAPI
 * - Ne duplique aucune logique de calcul ni de requête en base
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { detail: "Non authentifié" },
        { status: 401 }
      );
    }

    const authHeader = req.headers.get("authorization");
    const apiUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";

    const queryString = req.nextUrl.searchParams.toString();
    const targetUrl = `${apiUrl}/api/analytics/compare${queryString ? `?${queryString}` : ""}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const backendRes = await fetch(targetUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err: any) {
    console.error("GET /api/analytics/compare forwarder error:", err);
    return NextResponse.json(
      {
        detail:
          "Le service de calcul analytique est momentanément indisponible.",
      },
      { status: 503 }
    );
  }
}
