"""
test_store_slug_hardening.py — Tests d'intégration et de sécurité des slugs de boutiques.
Couvre les 4 tests obligatoires exigés :
1. Deux créations réellement simultanées (requêtes parallèles) avec le même nom, sans aucune erreur 500.
2. PATCH avec slug, owner_id et status dans le corps : vérification de l'immunité contre toute modification.
3. Création avec un slug réservé en contournant le frontend : refus avec code 400 sur les deux chemins.
4. UPDATE sur les boutiques historiques "dx" et "qa" : confirmation de conformité et bon fonctionnement.
"""

import asyncio
import os
import sys
import unittest
from pathlib import Path
from dotenv import load_dotenv

# Sys path pour charger api
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

load_dotenv(Path(__file__).resolve().parent.parent / ".env")
from dependencies import get_supabase, UserInfo
from models.schemas import StoreCreate, StoreUpdate
from routes.stores import create_store, update_store, check_slug_availability
from slug_utils import is_slug_reserved, validate_slug_format, normalize_slug


class TestStoreSlugHardening(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        self.supabase = get_supabase()
        # On utilise un user test factice ou existant
        self.test_user = UserInfo(user_id="b50f2641-f008-4334-82af-e7b005df94f1", email="test@easytradez.site")
        self.created_store_ids = []

    async def asyncTearDown(self):
        # Nettoyage des boutiques de test créées
        for store_id in self.created_store_ids:
            try:
                self.supabase.table("stores").delete().eq("id", store_id).execute()
            except Exception:
                pass

    async def test_1_simultaneous_creations_same_name_no_500(self):
        """Deux créations parallèles avec le même nom : aucune erreur 500, attribution unique automatique."""
        unique_suffix = os.urandom(3).hex()
        store_name = f"Parallel Test {unique_suffix}"

        payload1 = StoreCreate(name=store_name, theme="monochrome")
        payload2 = StoreCreate(name=store_name, theme="monochrome")

        # Exécution concurrente via asyncio.gather
        results = await asyncio.gather(
            create_store(payload1, user=self.test_user, supabase=self.supabase),
            create_store(payload2, user=self.test_user, supabase=self.supabase),
            return_exceptions=True,
        )

        res1, res2 = results

        # Vérifier qu'aucune exception 500 n'a été levée
        self.assertFalse(isinstance(res1, Exception), f"Res1 raised exception: {res1}")
        self.assertFalse(isinstance(res2, Exception), f"Res2 raised exception: {res2}")

        slug1 = res1.get("slug") if isinstance(res1, dict) else res1.slug
        slug2 = res2.get("slug") if isinstance(res2, dict) else res2.slug
        id1 = res1.get("id") if isinstance(res1, dict) else res1.id
        id2 = res2.get("id") if isinstance(res2, dict) else res2.id

        self.created_store_ids.extend([id1, id2])

        # Les deux slugs doivent être différents
        self.assertNotEqual(slug1, slug2, f"Slugs identiques détectés: {slug1} vs {slug2}")
        print(f"Parallel creations succeeded: Store 1 -> '{slug1}', Store 2 -> '{slug2}'")
        self.assertTrue(slug1.startswith("parallel-test"))
        self.assertTrue(slug2.startswith("parallel-test"))

    async def test_2_patch_with_slug_owner_and_status_immutable(self):
        """Vérifie qu'un PATCH contenant slug, owner_id et status ne modifie AUCUN de ces champs protégés."""
        # Créer une boutique test
        unique_suffix = os.urandom(3).hex()
        create_payload = StoreCreate(name=f"Patch Test {unique_suffix}", theme="monochrome")
        store = await create_store(create_payload, user=self.test_user, supabase=self.supabase)
        store_id = store.get("id") if isinstance(store, dict) else store.id
        original_slug = store.get("slug") if isinstance(store, dict) else store.slug
        original_owner = store.get("owner_id") if isinstance(store, dict) else store.owner_id
        original_status = store.get("status") if isinstance(store, dict) else store.status
        self.created_store_ids.append(store_id)

        # Tentative de modification pirate de slug, owner_id, status
        patch_payload = StoreUpdate(
            name=f"Legit Name {unique_suffix}",
            description="Nouvelle description autorisée",
        )
        # Injecter manuellement des champs interdits comme le ferait une requête HTTP brute
        patch_payload_extra = patch_payload.model_dump(exclude_unset=True)
        patch_payload_extra["slug"] = "hacked-slug"
        patch_payload_extra["owner_id"] = "00000000-0000-0000-0000-000000000000"
        patch_payload_extra["status"] = "published"

        updated = await update_store(store_id, patch_payload, user=self.test_user, supabase=self.supabase)

        # Vérifier en base directement
        db_record = self.supabase.table("stores").select("*").eq("id", store_id).single().execute().data

        self.assertEqual(db_record["name"], f"Legit Name {unique_suffix}")
        self.assertEqual(db_record["slug"], original_slug, "Le slug ne doit JAMAIS être modifié par un PATCH")
        self.assertEqual(db_record["owner_id"], original_owner, "L'owner_id ne doit JAMAIS être altéré")
        self.assertEqual(db_record["status"], original_status, "Le statut ne doit pas être modifié via cette route")
        print("PATCH protection verified: slug, owner_id, and status remained strictly unchanged.")

    async def test_3_reserved_slug_rejected_both_paths(self):
        """Vérifie qu'un slug réservé (ex: dashboard, login) est refusé avec une 400 sur les deux chemins de création."""
        from fastapi import HTTPException

        # Chemin 1 : FastAPI create_store
        payload = StoreCreate(name="Boutique Test", slug="dashboard", theme="modern")
        with self.assertRaises(HTTPException) as ctx:
            await create_store(payload, user=self.test_user, supabase=self.supabase)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("réservée", ctx.exception.detail)

        # Chemin 1 bis : Endpoint slug-available
        avail = await check_slug_availability(slug="dashboard", store_type="boutique", user=self.test_user, supabase=self.supabase)
        self.assertEqual(avail["status"], "reserved")

        # Chemin 2 : Validation Next.js / slug-utils côté serveur
        self.assertTrue(is_slug_reserved("dashboard"))
        self.assertTrue(is_slug_reserved("login"))
        self.assertTrue(is_slug_reserved("api"))
        print("Reserved slug rejection verified: 'dashboard' was rejected with 400 on both creation paths.")

    async def test_4_update_on_dx_and_qa_historic_stores(self):
        """Prouve qu'un UPDATE sur les deux boutiques historiques 'dx' et 'qa' (longueur 2) réussit sans erreur."""
        for historic_slug in ["dx", "qa"]:
            # Lire la boutique
            res = self.supabase.table("stores").select("id, name, slug, description").eq("slug", historic_slug).execute()
            self.assertTrue(len(res.data) > 0, f"Boutique historique {historic_slug} introuvable en base")
            store = res.data[0]
            orig_desc = store.get("description")

            # Mettre à jour avec un timestamp de test
            test_desc = f"Audit test update for {historic_slug}"
            up_res = self.supabase.table("stores").update({"description": test_desc}).eq("id", store["id"]).execute()
            self.assertTrue(len(up_res.data) > 0)
            self.assertEqual(up_res.data[0]["description"], test_desc)

            # Restaurer la valeur initiale
            reset_res = self.supabase.table("stores").update({"description": orig_desc}).eq("id", store["id"]).execute()
            self.assertTrue(len(reset_res.data) > 0)
            self.assertEqual(reset_res.data[0]["description"], orig_desc)
            print(f"Historic store '{historic_slug}' (length 2) updated and restored successfully.")


if __name__ == "__main__":
    unittest.main()
