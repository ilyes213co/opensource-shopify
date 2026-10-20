/**
 * slug-utils.ts — Normalisation, validation et réservation centralisées des slugs côté TypeScript.
 * Aligné à 100% avec api/slug_utils.py (FastAPI).
 */

export const RESERVED_SLUGS = new Set<string>([
  // Routes frontend platform/app/
  "dashboard",
  "login",
  "register",
  "auth",
  "api",
  "preview",
  "privacy",
  "terms",
  "manifest",
  "icon",
  "robots",
  "sitemap",
  "favicon",
  "_next",
  // Mots réservés système et métier requis
  "easytrade",
  "easytradez",
  "settings",
  "billing",
  "checkout",
  "cart",
  "orders",
  "funnels",
  "boutiques",
  "blog",
  "docs",
  "status",
  "callback",
  "verify",
  "reset",
  // Sous-domaines / infrastructure
  "admin",
  "app",
  "www",
  "mail",
  "support",
  "help",
  "pricing",
  "upgrade",
  "about",
  "static",
  "assets",
  "public",
  "stores",
  "products",
  "upload",
  "deploy",
  "analytics",
  "team",
  "payment",
  "webhook",
  "cdn",
  "test",
  "demo",
  "pricing",
  "about",
  "blog",
  // Marques et entités tierces protégées (interdites à l'inscription)
  "apple",
  "adidas",
  "nike",
  "gucci",
  "samsung",
  "huawei",
  "xiaomi",
  "sony",
  "lg",
  "oppo",
  "realme",
  "vivo",
  "dell",
  "hp",
  "lenovo",
  "asus",
  "acer",
  "intel",
  "amd",
  "microsoft",
  "google",
  "zara",
  "louisvuitton",
  "chanel",
  "dior",
  "prada",
  "rolex",
  "lacoste",
  "puma",
  "reebok",
  "bershka",
  "pullandbear",
  "stradivarius",
  "sephora",
  "cartier",
  "balenciaga",
  "versace",
  "armani",
  "hermes",
  "burberry",
  // Transporteurs & institutions algériennes
  "yalidine",
  "zrexpress",
  "procolis",
  "maystro",
  "baridimob",
  "algerieposte",
  "satim",
  "cib",
  "edahabia",
]);

/**
 * Slugs réservés aux tests internes, sandbox ou vérifications techniques
 * Ces boutiques doivent être automatiquement exclues de l'indexation (noindex) et du sitemap.
 */
export const TEST_SANDBOX_SLUGS = new Set<string>([
  "jjj",
  "sss",
  "zzz",
  "ggg",
  "eee",
  "qa",
  "eeee05",
  "test",
  "sandbox",
  "dev",
  "test-store",
  "admin-test",
  "qa-store",
]);

export function isTestStore(slug: string, storeData?: any): boolean {
  if (!slug) return false;
  const clean = slug.trim().toLowerCase();
  if (TEST_SANDBOX_SLUGS.has(clean)) return true;
  if (clean.startsWith("test-") || clean.startsWith("qa-") || clean.startsWith("sandbox-")) return true;
  if (storeData?.is_sandbox === true || storeData?.settings?.is_sandbox === true) return true;
  return false;
}


export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const MIN_SLUG_LENGTH = 3;
export const MAX_SLUG_LENGTH = 40;

export function stripAccents(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function generateFallbackSlug(storeType: string = "boutique"): string {
  const prefix = storeType === "funnel" ? "funnel" : "boutique";
  const charset = "abcdefghijklmnopqrstuvwxyz0123456789";
  let rand4 = "";
  for (let i = 0; i < 4; i++) {
    rand4 += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return `${prefix}-${rand4}`;
}

export function normalizeSlug(text: string, storeType: string = "boutique"): string {
  if (!text) {
    return generateFallbackSlug(storeType);
  }

  // 1. Décomposition Unicode et minuscules
  const deaccented = stripAccents(text.trim().toLowerCase());

  // 2. Remplacer tout ce qui n'est pas a-z ou 0-9 par un tiret
  let cleaned = deaccented.replace(/[^a-z0-9]+/g, "-");

  // 3. Réduire tirets consécutifs et retirer tirets de début/fin
  cleaned = cleaned.replace(/-+/g, "-").replace(/^-+|-+$/g, "");

  // 4. Tronquer à MAX_SLUG_LENGTH (40) sans couper sur un tiret
  if (cleaned.length > MAX_SLUG_LENGTH) {
    cleaned = cleaned.slice(0, MAX_SLUG_LENGTH).replace(/-+$/, "");
  }

  // 5. Si vide ou inférieur à MIN_SLUG_LENGTH (3), repli aléatoire
  if (cleaned.length < MIN_SLUG_LENGTH) {
    return generateFallbackSlug(storeType);
  }

  return cleaned;
}

export function isSlugReserved(slug: string): boolean {
  return RESERVED_SLUGS.has((slug || "").trim().toLowerCase());
}

export function validateSlugFormat(slug: string): { isValid: boolean; reason?: string } {
  if (!slug) {
    return { isValid: false, reason: "Le slug ne peut pas être vide." };
  }
  if (slug.length < MIN_SLUG_LENGTH) {
    return { isValid: false, reason: `Le slug doit contenir au moins ${MIN_SLUG_LENGTH} caractères.` };
  }
  if (slug.length > MAX_SLUG_LENGTH) {
    return { isValid: false, reason: `Le slug ne peut pas dépasser ${MAX_SLUG_LENGTH} caractères.` };
  }
  if (!SLUG_PATTERN.test(slug)) {
    return {
      isValid: false,
      reason: "Format invalide : seuls les lettres minuscules, chiffres et tirets uniques sont autorisés (ex: ma-boutique).",
    };
  }
  return { isValid: true };
}

export function getCandidateSlug(baseSlug: string, attempt: number): string {
  if (attempt <= 0) {
    return baseSlug;
  }

  const match = baseSlug.match(/^(.*?)-(\d+)$/);
  let cand = "";
  if (match) {
    const prefix = match[1] ?? "";
    const nextNum = parseInt(match[2] ?? "0", 10) + attempt;
    cand = `${prefix}-${nextNum}`;
  } else {
    cand = `${baseSlug}-${attempt}`;
  }

  if (cand.length > MAX_SLUG_LENGTH) {
    const suffix = `-${attempt}`;
    cand = `${baseSlug.slice(0, MAX_SLUG_LENGTH - suffix.length).replace(/-+$/, "")}${suffix}`;
  }

  return cand;
}

export function isUniqueSlugViolation(error: any): boolean {
  if (!error) return false;
  const msg = String(error.message || "").toLowerCase();
  const code = String(error.code || "").toLowerCase();
  const details = String(error.details || "").toLowerCase();

  if (code.includes("23505") || msg.includes("23505") || details.includes("23505")) {
    return true;
  }
  if (msg.includes("duplicate key") || msg.includes("unique constraint") || msg.includes("already exists")) {
    return true;
  }
  if (msg.includes("stores_slug") || msg.includes("stores_slug_lower_uniq")) {
    return true;
  }
  return false;
}
