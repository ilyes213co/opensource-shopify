"""
Tests unitaires pour la normalisation, la validation des slugs et les mots réservés.
"""

import os
import re
import sys
import unittest
from pathlib import Path

# Ajouter le dossier api au sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from slug_utils import (
    normalize_slug,
    is_slug_reserved,
    validate_slug_format,
    generate_fallback_slug,
    RESERVED_SLUGS,
    SLUG_PATTERN,
    check_brand_blocklist,
    BRAND_REJECTION_MESSAGE,
)


class TestSlugUtils(unittest.TestCase):

    def test_brand_blocklist(self):
        cases = [
            ("adidas-store", True),
            ("Adidas-Store", True),
            ("apple", True),
            ("apple-shop", True),
            ("my-nike-shop", True),
            ("shein-dz", True),
            ("temu-algerie", True),
            ("louis-vuitton", True),
            ("hm", True),
            ("hm-store", True),
            ("novatech-store", False),
            ("sportstyle-dz", False),
            ("maison-guanzo", False),
        ]
        for name, expected in cases:
            blocked, reason = check_brand_blocklist(name)
            self.assertEqual(blocked, expected, f"Failed for {name}")
            if expected:
                self.assertEqual(reason, BRAND_REJECTION_MESSAGE)

        self.assertTrue(is_slug_reserved("adidas-store"))
        self.assertFalse(is_slug_reserved("novatech-store"))

    def test_elegance(self):
        slug = normalize_slug("Élégance")
        self.assertEqual(slug, "elegance")
        valid, reason = validate_slug_format(slug)
        self.assertTrue(valid, reason)
        self.assertFalse(is_slug_reserved(slug))

    def test_stars_symbols_only(self):
        slug = normalize_slug("***", store_type="boutique")
        self.assertTrue(slug.startswith("boutique-"))
        self.assertEqual(len(slug), len("boutique-") + 4)
        valid, reason = validate_slug_format(slug)
        self.assertTrue(valid, reason)

    def test_arabic_name(self):
        slug = normalize_slug("متجر النور", store_type="funnel")
        self.assertTrue(slug.startswith("funnel-"))
        self.assertEqual(len(slug), len("funnel-") + 4)
        valid, reason = validate_slug_format(slug)
        self.assertTrue(valid, reason)

    def test_eighty_characters(self):
        long_name = "a" * 80
        slug = normalize_slug(long_name)
        self.assertEqual(len(slug), 40)
        self.assertEqual(slug, "a" * 40)
        valid, reason = validate_slug_format(slug)
        self.assertTrue(valid, reason)

    def test_dashboard_reserved(self):
        slug = normalize_slug("Dashboard")
        self.assertEqual(slug, "dashboard")
        self.assertTrue(is_slug_reserved(slug))
        self.assertTrue(is_slug_reserved("DASHBOARD"))

    def test_various_cases(self):
        # Multiple dashes & trim
        self.assertEqual(normalize_slug("---Mon Super---Store---"), "mon-super-store")
        # Accents mixed with numbers
        self.assertEqual(normalize_slug("Café & Délices 123 !"), "cafe-delices-123")
        # Emoji fallback
        slug_emoji = normalize_slug("🔥🚀")
        self.assertTrue(slug_emoji.startswith("boutique-"))

    def test_all_platform_app_directories_are_reserved(self):
        """
        Vérifie automatiquement que tous les dossiers de premier niveau de platform/app/
        sont présents dans RESERVED_SLUGS.
        """
        repo_root = Path(__file__).resolve().parent.parent.parent
        app_dir = repo_root / "platform" / "app"
        self.assertTrue(app_dir.is_dir(), f"Dossier introuvable: {app_dir}")

        missing_dirs = []
        for item in app_dir.iterdir():
            if item.is_dir():
                name = item.name
                # Les routes dynamiques [slug] ne sont pas un nom fixe réservé
                if name.startswith("[") and name.endswith("]"):
                    continue
                # Route groups comme (auth) -> inspecter les sous-dossiers
                if name.startswith("(") and name.endswith(")"):
                    for sub in item.iterdir():
                        if sub.is_dir() and sub.name not in RESERVED_SLUGS:
                            missing_dirs.append(f"{name}/{sub.name}")
                    continue

                if name.lower() not in RESERVED_SLUGS:
                    missing_dirs.append(name)

        self.assertEqual(
            missing_dirs,
            [],
            f"Les dossiers suivants de platform/app/ ne sont pas dans RESERVED_SLUGS: {missing_dirs}",
        )


if __name__ == "__main__":
    unittest.main()
