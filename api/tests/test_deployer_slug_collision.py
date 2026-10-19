"""
test_deployer_slug_collision.py — Tests unitaires avec mocks pour api/services/deployer.py
Vérifie les exigences du point 6 :
1. Pour une boutique sans github_repo ni vercel_project_id, si store-{slug} existe déjà (GitHub ou Vercel),
   deployer utilise store-{slug}-{8 premiers chars id} sans écraser.
2. Si store-{slug} n'existe pas, utilise store-{slug}.
3. Si la boutique a déjà un github_repo enregistré, continue de l'utiliser.
4. Si le sous-domaine est déjà rattaché à un autre projet Vercel, ne le réattribue pas,
   l'ignore et l'indique dans le résultat (subdomain_status = "conflict_ignored").
AUCUN APPEL RÉEL À GITHUB, VERCEL OU SUPABASE.
"""

import asyncio
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.deployer import StoreDeployer


class TestDeployerSlugCollision(unittest.IsolatedAsyncioTestCase):

    def setUp(self):
        self.deployer = StoreDeployer()
        self.fake_owner = "test-owner"
        self.patch_env = patch.dict(
            os.environ,
            {
                "GITHUB_OWNER": self.fake_owner,
                "GITHUB_TOKEN": "fake-gh-token",
                "VERCEL_TOKEN": "fake-vc-token",
                "PLATFORM_DOMAIN": "easytradez.site",
            },
        )
        self.patch_env.start()

    def tearDown(self):
        self.patch_env.stop()

    def _create_mock_supabase(self, store_data):
        mock_supabase = MagicMock()
        # Mock table("stores").select(...).eq(...).single().execute()
        single_mock = MagicMock()
        single_mock.execute.return_value = MagicMock(data=store_data)
        
        select_mock = MagicMock()
        select_mock.eq.return_value = MagicMock(single=MagicMock(return_value=single_mock))
        
        # Mock other stores query
        other_mock = MagicMock()
        other_mock.execute.return_value = MagicMock(data=[])
        select_mock.neq.return_value = other_mock
        
        # Mock update
        update_mock = MagicMock()
        update_mock.eq.return_value = MagicMock(execute=MagicMock(return_value=MagicMock(data=[store_data])))
        
        table_mock = MagicMock()
        table_mock.select.return_value = select_mock
        table_mock.update.return_value = update_mock
        
        mock_supabase.table.return_value = table_mock
        return mock_supabase

    @patch("services.deployer.get_supabase")
    async def test_collision_github_repo_falls_back_to_short_id(self, mock_get_sb):
        """Boutique sans repo ni projet : si store-slug existe sur GitHub, utilise store-slug-shortid."""
        store_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
        store_data = {
            "id": store_id,
            "name": "Boutique Test",
            "slug": "maboutique",
            "github_repo": None,
            "vercel_project_id": None,
        }
        mock_sb = self._create_mock_supabase(store_data)
        mock_get_sb.return_value = mock_sb

        # Mock les helpers internes pour isoler la décision du nom
        with patch.object(self.deployer, "_ensure_github_repo", new_callable=AsyncMock) as mock_gh_repo, \
             patch.object(self.deployer, "_ensure_vercel_project", new_callable=AsyncMock) as mock_vc_proj, \
             patch.object(self.deployer, "_trigger_deployment", new_callable=AsyncMock) as mock_trigger, \
             patch.object(self.deployer, "_add_vercel_domain", new_callable=AsyncMock) as mock_domain:

            mock_gh_repo.return_value = "https://github.com/test-owner/store-maboutique-a1b2c3d4"
            mock_vc_proj.return_value = "prj_123"
            mock_trigger.return_value = ("https://store-maboutique-a1b2c3d4.vercel.app", "dep_123")
            mock_domain.return_value = (True, "configured", None)

            # Simuler que store-maboutique existe sur GitHub (200)
            async def fake_http_get(url, headers=None, timeout=None):
                mock_resp = MagicMock()
                if "store-maboutique" in url and "a1b2c3d4" not in url:
                    mock_resp.status_code = 200  # Collision détectée
                else:
                    mock_resp.status_code = 404
                return mock_resp

            with patch("httpx.AsyncClient.get", side_effect=fake_http_get):
                result = await self.deployer.deploy_store(store_id, "<html></html>", {})

            # Vérifier que le nom unique dérivé des 8 premiers chars de store_id a été utilisé
            expected_repo = "store-maboutique-a1b2c3d4"
            self.assertEqual(result["repo_name"], expected_repo)
            mock_gh_repo.assert_called_once()
            # Le 3ème argument est repo_name
            self.assertEqual(mock_gh_repo.call_args[0][2], expected_repo)

    @patch("services.deployer.get_supabase")
    async def test_no_collision_uses_default_store_slug(self, mock_get_sb):
        """Boutique sans repo ni projet : si store-slug n'existe ni sur GitHub ni sur Vercel, utilise store-slug."""
        store_id = "f9e8d7c6-b5a4-3210-9876-fedcba098765"
        store_data = {
            "id": store_id,
            "name": "Nouvelle Boutique",
            "slug": "brandnew",
            "github_repo": None,
            "vercel_project_id": None,
        }
        mock_sb = self._create_mock_supabase(store_data)
        mock_get_sb.return_value = mock_sb

        with patch.object(self.deployer, "_ensure_github_repo", new_callable=AsyncMock) as mock_gh_repo, \
             patch.object(self.deployer, "_ensure_vercel_project", new_callable=AsyncMock) as mock_vc_proj, \
             patch.object(self.deployer, "_trigger_deployment", new_callable=AsyncMock) as mock_trigger, \
             patch.object(self.deployer, "_add_vercel_domain", new_callable=AsyncMock) as mock_domain:

            mock_gh_repo.return_value = "https://github.com/test-owner/store-brandnew"
            mock_vc_proj.return_value = "prj_brandnew"
            mock_trigger.return_value = ("https://store-brandnew.vercel.app", "dep_brandnew")
            mock_domain.return_value = (True, "configured", None)

            # Simuler 404 partout (aucune collision)
            async def fake_http_get(url, headers=None, timeout=None):
                mock_resp = MagicMock()
                mock_resp.status_code = 404
                return mock_resp

            with patch("httpx.AsyncClient.get", side_effect=fake_http_get):
                result = await self.deployer.deploy_store(store_id, "<html></html>", {})

            self.assertEqual(result["repo_name"], "store-brandnew")
            self.assertEqual(mock_gh_repo.call_args[0][2], "store-brandnew")

    @patch("services.deployer.get_supabase")
    async def test_existing_store_keeps_registered_identifiers(self, mock_get_sb):
        """Boutique ayant déjà un github_repo enregistré : continue de l'utiliser sans modification."""
        store_id = "11223344-5566-7788-99aa-bbccddeeff00"
        store_data = {
            "id": store_id,
            "name": "Boutique Existante",
            "slug": "existante",
            "github_repo": "test-owner/custom-legacy-repo",
            "vercel_project_id": "prj_legacy_999",
        }
        mock_sb = self._create_mock_supabase(store_data)
        mock_get_sb.return_value = mock_sb

        with patch.object(self.deployer, "_ensure_github_repo", new_callable=AsyncMock) as mock_gh_repo, \
             patch.object(self.deployer, "_ensure_vercel_project", new_callable=AsyncMock) as mock_vc_proj, \
             patch.object(self.deployer, "_trigger_deployment", new_callable=AsyncMock) as mock_trigger, \
             patch.object(self.deployer, "_add_vercel_domain", new_callable=AsyncMock) as mock_domain:

            mock_gh_repo.return_value = "https://github.com/test-owner/custom-legacy-repo"
            mock_vc_proj.return_value = "prj_legacy_999"
            mock_trigger.return_value = ("https://custom-legacy-repo.vercel.app", "dep_legacy")
            mock_domain.return_value = (True, "configured", None)

            result = await self.deployer.deploy_store(store_id, "<html></html>", {})

            # Conserve scrupuleusement custom-legacy-repo
            self.assertEqual(result["repo_name"], "custom-legacy-repo")
            self.assertEqual(mock_gh_repo.call_args[0][2], "custom-legacy-repo")

    @patch("services.deployer.get_supabase")
    async def test_subdomain_conflict_ignored_and_noted(self, mock_get_sb):
        """Si le sous-domaine est déjà attaché à un autre projet Vercel, ne le réattribue pas et l'indique."""
        store_id = "99887766-5544-3322-1100-aabbccddeeff"
        store_data = {
            "id": store_id,
            "name": "Boutique Subdomain Test",
            "slug": "myslug",
            "github_repo": None,
            "vercel_project_id": None,
        }
        mock_sb = self._create_mock_supabase(store_data)
        mock_get_sb.return_value = mock_sb

        with patch.object(self.deployer, "_ensure_github_repo", new_callable=AsyncMock) as mock_gh_repo, \
             patch.object(self.deployer, "_ensure_vercel_project", new_callable=AsyncMock) as mock_vc_proj, \
             patch.object(self.deployer, "_trigger_deployment", new_callable=AsyncMock) as mock_trigger, \
             patch.object(self.deployer, "_add_vercel_domain", new_callable=AsyncMock) as mock_domain:

            mock_gh_repo.return_value = "https://github.com/test-owner/store-myslug"
            mock_vc_proj.return_value = "prj_new_123"
            mock_trigger.return_value = ("https://store-myslug.vercel.app", "dep_myslug")
            
            # Simuler un refus de réattribution car déjà lié à un autre projet
            mock_domain.return_value = (
                False,
                "conflict_ignored",
                "Le sous-domaine myslug.easytradez.site est déjà rattaché à un autre projet Vercel et n'a pas été réattribué."
            )

            async def fake_http_get(url, headers=None, timeout=None):
                mock_resp = MagicMock()
                mock_resp.status_code = 404
                return mock_resp

            with patch("httpx.AsyncClient.get", side_effect=fake_http_get):
                result = await self.deployer.deploy_store(store_id, "<html></html>", {})

            # L'URL finale se rabat sur l'URL vercel canonique
            self.assertEqual(result["url"], "https://store-myslug.vercel.app")
            self.assertEqual(result["subdomain_status"], "conflict_ignored")
            self.assertIn("subdomain_warning", result)
            self.assertIn("déjà rattaché à un autre projet", result["subdomain_warning"])


if __name__ == "__main__":
    unittest.main()
