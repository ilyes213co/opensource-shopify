import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Redirections 301 & 410 Gone pour les anciens slugs sensibles ─────────────
  if (pathname === "/apple") {
    return NextResponse.redirect(new URL("/novatech-store", request.url), 301);
  }
  if (pathname.startsWith("/apple/")) {
    const suffix = pathname.slice("/apple".length);
    return NextResponse.redirect(new URL(`/novatech-store${suffix}`, request.url), 301);
  }
  if (pathname === "/adidas") {
    return NextResponse.redirect(new URL("/sportstyle-dz", request.url), 301);
  }
  if (pathname.startsWith("/adidas/")) {
    const suffix = pathname.slice("/adidas".length);
    return NextResponse.redirect(new URL(`/sportstyle-dz${suffix}`, request.url), 301);
  }
  if (pathname === "/luxury-guanzo") {
    return NextResponse.redirect(new URL("/maison-guanzo", request.url), 301);
  }
  if (pathname.startsWith("/luxury-guanzo/")) {
    const suffix = pathname.slice("/luxury-guanzo".length);
    return NextResponse.redirect(new URL(`/maison-guanzo${suffix}`, request.url), 301);
  }
  if (pathname === "/eeeee05" || pathname.startsWith("/eeeee05/")) {
    return new NextResponse(
      "<!DOCTYPE html><html><head><title>410 Gone</title></head><body style=\"font-family:sans-serif;background:#06060f;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;\"><div style=\"text-align:center;\"><h1 style=\"font-size:3rem;margin-bottom:1rem;\">410 Gone</h1><p style=\"color:#94a3b8;\">Cette boutique de test a été définitivement supprimée.</p></div></body></html>",
      {
        status: 410,
        statusText: "Gone",
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      }
    );
  }

  const publicRoutes = ["/login", "/register", "/auth/callback", "/demo"];
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));
  const isDashboard = pathname.startsWith("/dashboard");
  const isSlug =
    !isDashboard &&
    !pathname.startsWith("/api") &&
    !isPublic &&
    pathname !== "/";
  const hasAuthCookies = request.cookies
    .getAll()
    .some(
      ({ name }) =>
        name.startsWith("sb-") &&
        (name.includes("-auth-token") || name.includes("-auth-token-code-verifier"))
    );

  // Avoid a Supabase roundtrip for anonymous public requests.
  if (isSlug || (isPublic && !hasAuthCookies) || (pathname === "/" && !hasAuthCookies)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname === "/") {
    if (user) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return supabaseResponse;
  }

  if (pathname.startsWith("/dashboard") && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublic && user && pathname !== "/auth/callback") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
