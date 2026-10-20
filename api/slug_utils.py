"""
slug_utils.py — Normalisation, validation et réservation centralisées des slugs de boutiques et funnels.
Autorité unique de génération et validation des slugs pour EasyTrade.
"""

from __future__ import annotations

import re
import secrets
import unicodedata
from typing import Literal, Tuple, List, Optional

# Liste centralisée des mots réservés (système, routes Next.js, dossiers platform/app/, sous-domaines)
RESERVED_SLUGS: set[str] = {
    # Routes frontend platform/app/
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
    # Mots réservés système et métier requis
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
    # Sous-domaines / infrastructure
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
    # Marques et entités tierces protégées (interdites à l'inscription)
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
    # Transporteurs & institutions algériennes
    "yalidine",
    "zrexpress",
    "procolis",
    "maystro",
    "baridimob",
    "algerieposte",
    "satim",
    "cib",
    "edahabia",
}

PROTECTED_BRANDS: list[str] = [
    "apple",
    "adidas",
    "nike",
    "puma",
    "gucci",
    "louisvuitton",
    "chanel",
    "samsung",
    "huawei",
    "xiaomi",
    "iphone",
    "macbook",
    "jordan",
    "lacoste",
    "zara",
    "hm",
    "shein",
    "temu",
    "dior",
    "prada",
    "rolex",
    "balenciaga",
    "versace",
    "armani",
    "hermes",
    "burberry",
    "cartier",
    "sephora",
    "bershka",
    "pullandbear",
    "stradivarius",
]

BRAND_REJECTION_MESSAGE = (
    "Ce nom de boutique n'est pas disponible. Choisissez un nom qui ne reprend pas une marque existante."
)


def check_brand_blocklist(slug_or_name: str) -> Tuple[bool, Optional[str]]:
    """
    Vérifie si un nom ou slug de boutique reprend une marque protégée ou une de ses variations.
    Retourne (True, BRAND_REJECTION_MESSAGE) si bloqué, sinon (False, None).
    """
    if not slug_or_name:
        return False, None
    raw = strip_accents(slug_or_name).lower()
    clean = re.sub(r"[^a-z0-9]", "", raw)
    tokens = [t for t in re.split(r"[^a-z0-9]+", raw) if t]

    for brand in PROTECTED_BRANDS:
        b_clean = re.sub(r"[^a-z0-9]", "", brand.lower())
        if len(b_clean) <= 2:
            if (
                clean == b_clean
                or b_clean in tokens
                or clean.startswith(b_clean)
                or clean.endswith(b_clean)
                or clean == "handm"
            ):
                return True, BRAND_REJECTION_MESSAGE
        else:
            if b_clean in clean:
                return True, BRAND_REJECTION_MESSAGE

    return False, None


TEST_SANDBOX_SLUGS: set[str] = {
    "jjj",
    "sss",
    "zzz",
    "ggg",
    "eee",
    "qa",
    "eeee05",
    "eeeee05",
    "test",
    "sandbox",
    "dev",
    "test-store",
    "admin-test",
    "qa-store",
}


def is_test_store(slug: str, store_data: Optional[dict] = None) -> bool:
    if not slug:
        return False
    clean = slug.strip().lower()
    if clean in TEST_SANDBOX_SLUGS:
        return True
    if clean.startswith("test-") or clean.startswith("qa-") or clean.startswith("sandbox-"):
        return True
    if store_data and (store_data.get("is_sandbox") or (store_data.get("settings") or {}).get("is_sandbox")):
        return True
    return False

SLUG_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
MIN_SLUG_LENGTH = 3
MAX_SLUG_LENGTH = 40


def strip_accents(text: str) -> str:
    """Supprime les accents et diacritiques (NFD decomposition)."""
    return "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    )


def generate_fallback_slug(store_type: str = "boutique") -> str:
    """
    Génère un repli 'boutique-XXXX' ou 'funnel-XXXX' avec 4 caractères aléatoires
    si le nom d'origine ne produit aucun caractère alphanumérique valide (ex: arabe, emojis).
    """
    prefix = "funnel" if store_type == "funnel" else "boutique"
    charset = "abcdefghijklmnopqrstuvwxyz0123456789"
    rand4 = "".join(secrets.choice(charset) for _ in range(4))
    return f"{prefix}-{rand4}"


def normalize_slug(text: str, store_type: str = "boutique") -> str:
    """
    Normalise une chaîne en un slug DNS-compatible :
    - Minuscules
    - Accents retirés
    - Caractères non-alphanumériques remplacés par des tirets
    - Tirets multiples réduits à un seul
    - Pas de tiret au début ni à la fin
    - Longueur max 40 caractères
    - Repli automatique si le résultat est vide ou inférieur à 3 caractères.
    """
    if not text:
        return generate_fallback_slug(store_type)

    # 1. Décomposition Unicode pour retirer les accents
    deaccented = strip_accents(text.strip().lower())

    # 2. Remplacer tout ce qui n'est pas a-z ou 0-9 par un tiret
    cleaned = re.sub(r"[^a-z0-9]+", "-", deaccented)

    # 3. Réduire les tirets multiples et retirer les tirets de bord
    cleaned = re.sub(r"-+", "-", cleaned)
    cleaned = re.sub(r"^-+|-+$", "", cleaned)

    # 4. Tronquer à MAX_SLUG_LENGTH (40) sans couper sur un tiret final
    if len(cleaned) > MAX_SLUG_LENGTH:
        cleaned = cleaned[:MAX_SLUG_LENGTH].rstrip("-")

    # 5. Si vide ou trop court (< 3 caractères), repli aléatoire
    if len(cleaned) < MIN_SLUG_LENGTH:
        return generate_fallback_slug(store_type)

    return cleaned


def is_slug_reserved(slug: str) -> bool:
    """Vérifie si un slug correspond à un mot système réservé ou une marque protégée."""
    if not slug:
        return False
    clean = slug.strip().lower()
    is_blocked, _ = check_brand_blocklist(clean)
    return clean in RESERVED_SLUGS or is_blocked


def validate_slug_format(slug: str) -> Tuple[bool, Optional[str]]:
    """
    Vérifie le format du slug.
    Retourne (True, None) si valide, ou (False, raison) si invalide.
    """
    if not slug:
        return False, "Le slug ne peut pas être vide."
    if len(slug) < MIN_SLUG_LENGTH:
        return False, f"Le slug doit contenir au moins {MIN_SLUG_LENGTH} caractères."
    if len(slug) > MAX_SLUG_LENGTH:
        return False, f"Le slug ne peut pas dépasser {MAX_SLUG_LENGTH} caractères."
    if not SLUG_PATTERN.match(slug):
        return (
            False,
            "Format invalide: seuls les lettres minuscules, chiffres et tirets uniques sont autorisés (ex: ma-boutique).",
        )
    return True, None


def get_candidate_slug(base_slug: str, attempt: int) -> str:
    """
    Génère un slug candidat pour une tentative d'insertion :
    - attempt 0: base_slug
    - attempt 1: base_slug-1
    - attempt 2: base_slug-2
    Si le slug se termine déjà par un chiffre (-1), incrémente le chiffre.
    Garantit que la longueur ne dépasse pas MAX_SLUG_LENGTH.
    """
    if attempt <= 0:
        return base_slug

    m = re.search(r"^(.*?)-(\d+)$", base_slug)
    if m:
        prefix = m.group(1)
        next_num = int(m.group(2)) + attempt
        cand = f"{prefix}-{next_num}"
    else:
        cand = f"{base_slug}-{attempt}"

    if len(cand) > MAX_SLUG_LENGTH:
        suffix = f"-{attempt}"
        cand = f"{base_slug[:MAX_SLUG_LENGTH - len(suffix)].rstrip('-')}{suffix}"

    return cand


def is_unique_slug_violation(exc: Any) -> bool:
    """Détecte si une exception Supabase/PostgREST correspond à une violation d'unicité de slug (code 23505)."""
    if exc is None:
        return False
    msg = str(exc).lower()
    code = str(getattr(exc, "code", "") or "").lower()
    details = str(getattr(exc, "details", "") or "").lower()

    if "23505" in code or "23505" in msg or "23505" in details:
        return True
    if "duplicate key" in msg or "unique constraint" in msg or "already exists" in msg:
        return True
    if "stores_slug" in msg or "stores_slug_lower_uniq" in msg:
        return True
    return False
