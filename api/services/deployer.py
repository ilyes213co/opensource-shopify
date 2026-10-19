"""
StoreDeployer — pushes a generated HTML store to Vercel.

Pipeline:
    1. Push the HTML/vercel.json/robots.txt to a GitHub repo
       (kept as a backup / future redeploy trigger)
    2. Create a Vercel project
    3. Try to link the project to the GitHub repo (best-effort — Vercel
       may refuse if its GitHub App isn't authorized for the GitHub
       account that owns the repo)
    4. Trigger a deployment. Two modes are tried in order:
         a. "gitSource" mode (uses the GitHub link) — fastest, supports
            automatic redeploys on `git push`
         b. "file upload" mode (sends the files inline) — always works
            because it doesn't need GitHub
    5. Return the public URL. The Vercel `*.vercel.app` URL is used by
       default; the custom `{slug}.{PLATFORM_DOMAIN}` is added
       best-effort and used if it succeeds.

Design notes
------------
* The previous version assumed the Vercel GitHub App was authorized for
  the same GitHub account that owns the deploy repo. In practice this is
  not always true (the Vercel account and the GitHub account are often
  separate identities). The new code treats the GitHub push as a
  source-of-truth backup and the Vercel deployment as the source of
  truth for serving the site.

* All Vercel error responses are surfaced verbatim in `deploy_jobs.error`
  so the next failure is self-explanatory instead of a generic "400 Bad
  Request".

* `PLATFORM_DOMAIN` is a nice-to-have. The store is always reachable at
  `{slug}.vercel.app` even if the custom domain is unconfigured.
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Optional

import httpx
from supabase import create_client

logger = logging.getLogger("storegen.deployer")

VERCEL_TOKEN    = os.getenv("VERCEL_TOKEN", "")
GITHUB_TOKEN    = os.getenv("GITHUB_TOKEN", "")
GITHUB_ORG      = os.getenv("GITHUB_ORG", "")
GITHUB_OWNER    = os.getenv("GITHUB_OWNER", "") or GITHUB_ORG
PLATFORM_DOMAIN = os.getenv("PLATFORM_DOMAIN", "yourdomain.com")

def get_vercel_headers() -> dict[str, str]:
    token = os.getenv("VERCEL_TOKEN", "").strip()
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


def get_github_headers() -> dict[str, str]:
    token = os.getenv("GITHUB_TOKEN", "").strip()
    return {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
    }


class _DynamicHeaders(dict):
    def __init__(self, generator):
        super().__init__()
        self._gen = generator

    def __getitem__(self, key):
        return self._gen()[key]

    def get(self, key, default=None):
        return self._gen().get(key, default)

    def copy(self):
        return self._gen().copy()

    def items(self):
        return self._gen().items()

    def keys(self):
        return self._gen().keys()

    def values(self):
        return self._gen().values()

    def __iter__(self):
        return iter(self._gen())

    def __repr__(self):
        return repr(self._gen())


GITHUB_HEADERS = _DynamicHeaders(get_github_headers)
VERCEL_HEADERS = _DynamicHeaders(get_vercel_headers)


def get_supabase():
    return create_client(
        os.getenv("NEXT_PUBLIC_SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_KEY"),
    )


# ─── Static template files ────────────────────────────────────────────────────

VERCEL_CONFIG = {
    "version": 2,
    "builds": [{"src": "index.html", "use": "@vercel/static"}],
    "routes": [{"src": r"/((?!.*\..*).*)", "dest": "/index.html"}],
}
VERCEL_JSON = json.dumps(VERCEL_CONFIG, indent=2)


# ─── Storefront runtime assets ─────────────────────────────────────────────────
# index.html references ./storefront-modern.css and ./storefront.js. Historically
# ONLY index.html + vercel.json were uploaded, so those assets were never shipped:
# the catch-all route then served them as index.html (i.e. HTML masquerading as
# JS/CSS), and the client runtime silently never ran — empty product grid, dead
# Buy buttons, hero stats stuck at 0. These helpers ensure every deploy ships
# the runtime alongside the page.

STORE_TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "store-template")

# Exact files referenced by template.html (kept in sync, in order).
STORE_ASSET_FILES = [
    "storefront-modern.css",
    "storefront.js",
]


def _load_store_assets():
    """Return ``[(filename, content), ...]`` for every storefront runtime asset.

    Missing files are logged and skipped so a half-configured checkout still
    deploys the page (analogous to the rest of this module's fail-soft style).
    """
    loaded = []
    for name in STORE_ASSET_FILES:
        path = os.path.join(STORE_TEMPLATE_DIR, name)
        if not os.path.isfile(path):
            logger.warning("Storefront asset missing: %s", path)
            continue
        with open(path, "r", encoding="utf-8") as fh:
            loaded.append((name, fh.read()))
    return loaded


# ─── Main deployer ────────────────────────────────────────────────────────────

class StoreDeployer:

    # ── Configuration guards ────────────────────────────────────────────────

    @staticmethod
    def _require_configured_owner() -> str:
        owner = (
            os.getenv("GITHUB_OWNER")
            or os.getenv("GITHUB_ORG")
            or globals().get("GITHUB_OWNER")
            or globals().get("GITHUB_ORG")
            or ""
        ).strip()
        if not owner:
            raise RuntimeError(
                "Configuration GitHub incomplète: définissez GITHUB_OWNER "
                "(ou GITHUB_ORG) avant de lancer un déploiement."
            )
        return owner

    @staticmethod
    def _ensure_required_tokens() -> None:
        github_token = os.getenv("GITHUB_TOKEN", "").strip()
        vercel_token = os.getenv("VERCEL_TOKEN", "").strip()
        if not github_token:
            raise RuntimeError("Configuration GitHub incomplète: GITHUB_TOKEN manquant.")
        if not vercel_token:
            raise RuntimeError("Configuration Vercel incomplète: VERCEL_TOKEN manquant.")

    # ── Public entry point ──────────────────────────────────────────────────

    async def deploy_store(self, store_id: str, html: str, seo: dict) -> dict:
        """
        Full pipeline. Returns ``{"url": "...", "project_id": "..."}``.

        Raises on any unrecoverable error. Best-effort steps (custom
        domain, GitHub link) are logged and skipped without aborting.
        """
        supabase = get_supabase()

        store = (
            supabase.table("stores")
            .select("*")
            .eq("id", store_id)
            .single()
            .execute()
            .data
        )
        if not store:
            raise ValueError(f"Store {store_id} not found")

        self._ensure_required_tokens()
        slug = store["slug"]
        owner = self._require_configured_owner()

        # 1. Utiliser le github_repo déjà stocké s'il existe, sinon convention store-{slug}
        stored_repo = (store.get("github_repo") or "").strip()
        stored_project = (store.get("vercel_project_id") or "").strip()
        if stored_repo:
            repo_name = stored_repo.rstrip("/").split("/")[-1]
        else:
            repo_name = f"store-{slug}"

        # 2. Sécurité anti-écrasement : refuser d'écraser un dépôt ou projet lié à un autre store_id
        try:
            other_stores_res = (
                supabase.table("stores")
                .select("id, name, slug, github_repo, vercel_project_id")
                .neq("id", store_id)
                .execute()
            )
            for other in (other_stores_res.data or []):
                other_repo = (other.get("github_repo") or "").strip()
                if other_repo:
                    other_repo_name = other_repo.rstrip("/").split("/")[-1]
                    if other_repo_name.lower() == repo_name.lower():
                        raise RuntimeError(
                            f"Conflit de déploiement : le dépôt GitHub '{repo_name}' est déjà associé à la boutique "
                            f"'{other.get('name')}' (ID: {other.get('id')}). Déploiement refusé pour éviter tout écrasement."
                        )
                # Vérification collision sur vercel_project_id
                if stored_project and other.get("vercel_project_id") == stored_project:
                    raise RuntimeError(
                        f"Conflit de déploiement : le projet Vercel '{stored_project}' est déjà associé à la boutique "
                        f"'{other.get('name')}' (ID: {other.get('id')}). Déploiement refusé pour éviter tout écrasement."
                    )
        except RuntimeError:
            raise
        except Exception as query_err:
            logger.warning("Vérification des conflits de déploiement non bloquante: %s", query_err)

        logger.info(
            "Deploy start store_id=%s owner=%s repo=%s",
            store_id, owner, repo_name,
        )

        async with httpx.AsyncClient(timeout=60.0) as http:

            # 1. bis : Pour une boutique sans github_repo ni vercel_project_id enregistrés,
            # si un dépôt GitHub ou projet Vercel store-{slug} existe déjà,
            # NE le réutilise PAS et n'écrase aucun fichier : utilise store-{slug}-{8 premiers caractères de l'id}.
            if not stored_repo and not stored_project:
                default_candidate = f"store-{slug}"
                collision = False
                try:
                    gh_chk = await http.get(
                        f"https://api.github.com/repos/{owner}/{default_candidate}",
                        headers=GITHUB_HEADERS,
                    )
                    if gh_chk.status_code == 200:
                        collision = True
                except Exception as e:
                    logger.warning("Vérification collision GitHub %s ignorée: %s", default_candidate, e)

                if not collision:
                    try:
                        vc_chk = await http.get(
                            f"https://api.vercel.com/v9/projects/{default_candidate}",
                            headers=VERCEL_HEADERS,
                        )
                        if vc_chk.status_code == 200:
                            collision = True
                    except Exception as e:
                        logger.warning("Vérification collision Vercel %s ignorée: %s", default_candidate, e)

                if collision:
                    short_id = str(store_id).replace("-", "")[:8].lower() if len(str(store_id).replace("-", "")) >= 8 else str(store_id)[:8].lower()
                    repo_name = f"store-{slug}-{short_id}"
                    logger.info(
                        "Dépôt ou projet existant détecté pour '%s'. Utilisation du nom unique '%s' pour la boutique %s.",
                        default_candidate, repo_name, store_id,
                    )

            # ── Step 1: GitHub repo (best-effort) ───────────────────────
            github_url: Optional[str] = None
            try:
                logger.info("Deploy step=github_repo store_id=%s repo=%s", store_id, repo_name)
                github_url = await self._ensure_github_repo(
                    http, owner, repo_name, html, seo, store,
                )
            except Exception as e:
                # Non-fatal: Vercel can still deploy via file upload
                logger.warning(
                    "GitHub push failed for %s/%s (non-fatal): %s",
                    owner, repo_name, e,
                )

            # ── Step 2: Vercel project ──────────────────────────────────
            logger.info("Deploy step=vercel_project store_id=%s repo=%s", store_id, repo_name)
            project_id = await self._ensure_vercel_project(
                http, owner, repo_name, store.get("vercel_project_id"),
            )

            # ── Step 3: Trigger deployment (gitSource → upload fallback)
            logger.info("Deploy step=vercel_build store_id=%s project_id=%s", store_id, project_id)
            deploy_url, deploy_id = await self._trigger_deployment(
                http, project_id, owner, repo_name, html,
            )

            # ── Step 4: Configure custom domain (best-effort) ──────────
            platform_domain = os.getenv("PLATFORM_DOMAIN", "").strip() or PLATFORM_DOMAIN
            subdomain = f"{slug}.{platform_domain}"
            custom_domain_ok = False
            subdomain_status = "not_configured"
            subdomain_warning = None

            if platform_domain and platform_domain not in ("yourdomain.com", "example.com"):
                try:
                    logger.info(
                        "Deploy step=domain store_id=%s project_id=%s domain=%s",
                        store_id, project_id, subdomain,
                    )
                    custom_domain_ok, subdomain_status, subdomain_warning = await self._add_vercel_domain(
                        http, project_id, subdomain,
                    )
                except Exception as e:
                    logger.warning(
                        "Custom domain %s add failed (non-fatal): %s",
                        subdomain, e,
                    )
                    subdomain_status = "error"
                    subdomain_warning = str(e)

            # ── Step 5: Choose the public URL ──────────────────────────
            canonical_vercel_url = f"https://{repo_name}.vercel.app"
            if custom_domain_ok:
                published_url = f"https://{subdomain}"
            else:
                published_url = canonical_vercel_url

            # ── Step 6: Update Supabase store record ────────────────────
            update_data = {
                "vercel_project_id": project_id,
                "subdomain": subdomain if custom_domain_ok else f"{repo_name}.vercel.app",
                "published_url": published_url,
                "status": "published",
                "generated_html": html,
            }
            if github_url or not store.get("github_repo"):
                update_data["github_repo"] = github_url or f"{owner}/{repo_name}"

            supabase.table("stores").update(update_data).eq("id", store_id).execute()

            logger.info(
                "Store %s deployed successfully: %s (github=%s, project=%s, subdomain_status=%s)",
                store_id, published_url, project_id, deploy_id, subdomain_status,
            )
            deploy_result = {
                "url": published_url,
                "project_id": project_id,
                "deployment_id": deploy_id,
                "repo_name": repo_name,
                "subdomain_status": subdomain_status,
            }
            if subdomain_warning:
                deploy_result["subdomain_warning"] = subdomain_warning
            return deploy_result

    # ── GitHub helpers ──────────────────────────────────────────────────────

    async def _ensure_github_repo(
        self, http: httpx.AsyncClient, owner: str, repo_name: str,
        html: str, seo: dict, store: dict,
    ) -> str:
        """
        Create the repo if missing, then push index.html + vercel.json +
        robots.txt. Returns the GitHub URL of the repo.

        Raises on any non-recoverable error. The caller is expected to
        catch and log; a failed GitHub push does NOT abort the deploy
        because Vercel can serve the site from the uploaded files alone.
        """
        check = await http.get(
            f"https://api.github.com/repos/{owner}/{repo_name}",
            headers=GITHUB_HEADERS,
        )

        if check.status_code == 404:
            endpoint = (
                f"https://api.github.com/orgs/{owner}/repos"
                if GITHUB_ORG
                else "https://api.github.com/user/repos"
            )
            resp = await http.post(
                endpoint, headers=GITHUB_HEADERS,
                json={"name": repo_name, "private": True, "auto_init": True},
            )
            if resp.status_code not in (200, 201):
                raise RuntimeError(
                    f"GitHub repo create failed ({resp.status_code}): {resp.text[:300]}"
                )
            await asyncio.sleep(2)  # let GitHub finish initializing the repo

        # Push / update files
        await self._upsert_github_file(http, owner, repo_name, "index.html", html)
        await self._upsert_github_file(http, owner, repo_name, "vercel.json", VERCEL_JSON)
        await self._upsert_github_file(
            http, owner, repo_name, "robots.txt",
            f"User-agent: *\nAllow: /\nSitemap: https://{repo_name}.vercel.app/sitemap.xml",
        )
        # Ship the client runtime to the repo too, so the gitSource path serves
        # the same working page as the upload path.
        for name, content in _load_store_assets():
            await self._upsert_github_file(http, owner, repo_name, name, content)

        return f"https://github.com/{owner}/{repo_name}"

    async def _upsert_github_file(
        self, http: httpx.AsyncClient, owner: str, repo: str,
        path: str, content: str,
    ) -> None:
        encoded = base64.b64encode(content.encode("utf-8")).decode()
        url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"

        # Check if file exists (need its SHA for update)
        existing = await http.get(url, headers=GITHUB_HEADERS)
        sha = (
            existing.json().get("sha")
            if existing.status_code == 200
            else None
        )

        payload: dict[str, Any] = {
            "message": f"Update {path} — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}",
            "content": encoded,
        }
        if sha:
            payload["sha"] = sha

        resp = await http.put(url, headers=GITHUB_HEADERS, json=payload)
        if resp.status_code not in (200, 201):
            raise RuntimeError(
                f"GitHub file upsert failed for {path} ({resp.status_code}): {resp.text[:300]}"
            )

    # ── Vercel project ─────────────────────────────────────────────────────

    async def _ensure_vercel_project(
        self, http: httpx.AsyncClient, owner: str, repo_name: str,
        existing_project_id: Optional[str],
    ) -> str:
        """
        Create a Vercel project (or reuse the existing one) and
        best-effort link it to the GitHub repo. The link is best-effort
        because the Vercel GitHub App may not be authorized for the
        GitHub account that owns the repo.

        Returns the Vercel project ID.
        """
        if existing_project_id:
            check = await http.get(
                f"https://api.vercel.com/v9/projects/{existing_project_id}",
                headers=VERCEL_HEADERS,
            )
            if check.status_code == 200:
                logger.info(
                    "Vercel project %s already exists, reusing",
                    existing_project_id,
                )
                return existing_project_id

        # Attempt 1: create the project with the GitHub link.
        # This is the "good" path that enables automatic redeploys on
        # `git push` and shows the repo in the Vercel dashboard.
        resp = await http.post(
            "https://api.vercel.com/v10/projects",
            headers=VERCEL_HEADERS,
            timeout=20,
            json={
                "name": repo_name,
                "framework": None,
                "gitRepository": {
                    "type": "github",
                    "repo": f"{owner}/{repo_name}",
                },
                "buildCommand": None,
                "outputDirectory": "/",
                "installCommand": None,
            },
        )

        if resp.status_code in (200, 201):
            return resp.json()["id"]

        try:
            err = resp.json()
        except Exception:
            err = {"raw": resp.text[:200]}

        # If the project already exists on Vercel (409 conflict), reuse it!
        if resp.status_code == 409 or (isinstance(err, dict) and err.get("error", {}).get("code") == "conflict"):
            logger.info("Vercel project %s already exists, fetching existing project ID", repo_name)
            get_resp = await http.get(
                f"https://api.vercel.com/v9/projects/{repo_name}",
                headers=VERCEL_HEADERS,
            )
            if get_resp.status_code == 200:
                return get_resp.json()["id"]

        # If the link failed because Vercel can't see the repo on the
        # GitHub side, fall back to creating an unlinked project. This
        # always works because no GitHub access is required.
        try:
            err = resp.json()
        except Exception:
            err = {"raw": resp.text[:200]}

        if isinstance(err, dict) and err.get("error", {}).get("code") == "repo_not_found":
            logger.warning(
                "Vercel can't see %s/%s on GitHub (likely missing GitHub App "
                "authorization). Creating an unlinked project instead.",
                owner, repo_name,
            )
            resp2 = await http.post(
                "https://api.vercel.com/v10/projects",
                headers=VERCEL_HEADERS,
                timeout=20,
                json={"name": repo_name, "framework": None},
            )
            if resp2.status_code in (200, 201):
                return resp2.json()["id"]
            raise RuntimeError(
                f"Vercel project create (unlinked) failed "
                f"({resp2.status_code}): {resp2.text[:300]}"
            )

        # Any other error: surface it so the deploy job gets a useful
        # message and the user can debug.
        raise RuntimeError(
            f"Vercel project create failed ({resp.status_code}): "
            f"{json.dumps(err)[:500]}"
        )

    # ── Deployment trigger ─────────────────────────────────────────────────

    async def _trigger_deployment(
        self, http: httpx.AsyncClient, project_id: str, owner: str,
        repo_name: str, html: str, timeout_seconds: int = 300,
    ) -> tuple[str, str]:
        """
        Try gitSource mode first; if that fails, fall back to file
        upload. Returns ``(public_url, deployment_id)``.
        """
        # Attempt 1: gitSource (uses the GitHub link on the project)
        try:
            deploy_id = await self._create_deployment_gitsource(
                http, project_id, owner, repo_name,
            )
            url = await self._wait_deployment_ready(http, deploy_id, timeout_seconds)
            return url, deploy_id
        except Exception as e:
            logger.warning(
                "gitSource deployment failed (%s), falling back to file upload",
                e,
            )

        # Attempt 2: file upload (always works, no GitHub required)
        files = [
            {"file": "index.html", "data": html},
            {"file": "vercel.json", "data": VERCEL_JSON},
        ]
        # Ship the client runtime so the deployed page actually works
        # (storefront.js + storefront-modern.css). See _load_store_assets().
        files += [
            {"file": name, "data": content}
            for name, content in _load_store_assets()
        ]
        deploy_id = await self._create_deployment_upload(
            http, project_id, files,
        )
        url = await self._wait_deployment_ready(http, deploy_id, timeout_seconds)
        return url, deploy_id

    async def _create_deployment_gitsource(
        self, http: httpx.AsyncClient, project_id: str,
        owner: str, repo_name: str,
    ) -> str:
        """Create a deployment that uses the GitHub link on the project."""
        resp = await http.post(
            "https://api.vercel.com/v13/deployments",
            headers=VERCEL_HEADERS,
            timeout=20,
            json={
                "name": project_id,
                "project": project_id,
                "target": "production",
                "gitSource": {
                    "type": "github",
                    "org": owner,
                    "repo": repo_name,
                    "ref": "main",
                    "sha": "HEAD",
                },
            },
        )
        if resp.status_code not in (200, 201):
            try:
                err = resp.json()
            except Exception:
                err = {"raw": resp.text[:200]}
            raise RuntimeError(
                f"gitSource deploy create failed ({resp.status_code}): "
                f"{json.dumps(err)[:500]}"
            )
        return resp.json()["id"]

    async def _create_deployment_upload(
        self, http: httpx.AsyncClient, project_id: str,
        files: list[dict],
    ) -> str:
        """
        Create a deployment that uploads files inline. Used when
        gitSource mode is not available (Vercel GitHub App not
        authorized for the repo owner).
        """
        # Vercel expects each file's `data` field to be the raw content
        # (not base64-encoded). See
        # https://vercel.com/docs/rest-api#endpoints/deployments/create-deployment
        payload_files = []
        for f in files:
            payload_files.append({
                "file": f["file"],
                "data": f["data"],
            })

        resp = await http.post(
            "https://api.vercel.com/v13/deployments",
            headers=VERCEL_HEADERS,
            timeout=60,
            json={
                "name": project_id,
                "project": project_id,
                "target": "production",
                "files": payload_files,
            },
        )
        if resp.status_code not in (200, 201):
            try:
                err = resp.json()
            except Exception:
                err = {"raw": resp.text[:200]}
            raise RuntimeError(
                f"Upload deploy create failed ({resp.status_code}): "
                f"{json.dumps(err)[:500]}"
            )
        return resp.json()["id"]

    async def _wait_deployment_ready(
        self, http: httpx.AsyncClient, deploy_id: str, timeout_seconds: int,
    ) -> str:
        """
        Poll the deployment until it's READY (or ERROR). Returns the
        public URL (always with `https://` prefix).
        """
        for attempt in range(timeout_seconds // 5):
            await asyncio.sleep(5)
            status_resp = await http.get(
                f"https://api.vercel.com/v13/deployments/{deploy_id}",
                headers=VERCEL_HEADERS,
                timeout=15,
            )
            if status_resp.status_code != 200:
                logger.warning(
                    "Vercel status poll returned %d on attempt %d: %s",
                    status_resp.status_code, attempt, status_resp.text[:200],
                )
                continue

            data = status_resp.json()
            state = data.get("readyState", "")
            logger.debug("Deployment %s state: %s", deploy_id, state)

            if state == "READY":
                raw_url = data.get("url", "") or data.get("alias", [""])[0]
                if not raw_url:
                    raise RuntimeError(
                        f"Deployment {deploy_id} is READY but Vercel returned no URL"
                    )
                return (
                    raw_url if raw_url.startswith("http")
                    else f"https://{raw_url}"
                )
            if state in ("ERROR", "CANCELED"):
                # Try to extract Vercel's error message
                err = data.get("error") or data.get("errorMessage") or state
                raise RuntimeError(
                    f"Vercel deployment {deploy_id} failed with state={state}: {err}"
                )

        raise TimeoutError(
            f"Vercel deployment {deploy_id} did not become READY within "
            f"{timeout_seconds}s"
        )

    # ── Custom domain ──────────────────────────────────────────────────────

    async def _add_vercel_domain(
        self, http: httpx.AsyncClient, project_id: str, domain: str,
    ) -> tuple[bool, str, Optional[str]]:
        """
        Add a custom domain to the project.
        Returns: (success: bool, status: str, warning_or_error: Optional[str])
        If the domain is already attached to another project, does not reassign it,
        returns (False, "conflict_ignored", warning).
        """
        resp = await http.post(
            f"https://api.vercel.com/v10/projects/{project_id}/domains",
            headers=VERCEL_HEADERS,
            timeout=15,
            json={"name": domain},
        )

        if resp.status_code == 409:
            # Vérifier si le domaine appartient bien à CE projet spécifique
            chk_resp = await http.get(
                f"https://api.vercel.com/v9/projects/{project_id}/domains/{domain}",
                headers=VERCEL_HEADERS,
                timeout=10,
            )
            if chk_resp.status_code != 200:
                logger.warning(
                    "Domain %s is attached to another Vercel project (not %s). Skipping domain reassignment.",
                    domain, project_id,
                )
                return False, "conflict_ignored", f"Le sous-domaine {domain} est déjà rattaché à un autre projet Vercel et n'a pas été réattribué."
            logger.info("Domain %s already configured on project %s", domain, project_id)
        elif resp.status_code not in (200, 201):
            # Analyser si l'erreur 400 indique un conflit avec un autre projet
            try:
                err_data = resp.json().get("error", {})
                err_code = err_data.get("code", "")
                err_msg = err_data.get("message", "")
                if err_code in ("domain_already_in_use", "conflicting_domain") or "already in use" in err_msg.lower() or "belongs to" in err_msg.lower():
                    logger.warning(
                        "Domain %s is already in use by another project: %s. Skipping domain reassignment.",
                        domain, err_msg,
                    )
                    return False, "conflict_ignored", f"Le sous-domaine {domain} est déjà rattaché à un autre projet Vercel et n'a pas été réattribué."
            except Exception:
                pass

            logger.warning(
                "Domain add %s returned %d: %s",
                domain, resp.status_code, resp.text[:300],
            )
            return False, "error", f"Erreur Vercel {resp.status_code} lors de l'ajout du domaine {domain}"

        # Verify whether DNS actually resolves to Vercel
        try:
            cfg_resp = await http.get(
                f"https://api.vercel.com/v6/domains/{domain}/config",
                headers=VERCEL_HEADERS,
                timeout=10,
            )
            if cfg_resp.status_code == 200:
                cfg = cfg_resp.json()
                if cfg.get("misconfigured"):
                    logger.warning(
                        "Custom domain %s is misconfigured on Vercel (no DNS). Removing broken domain.",
                        domain,
                    )
                    await http.delete(
                        f"https://api.vercel.com/v9/projects/{project_id}/domains/{domain}",
                        headers=VERCEL_HEADERS,
                        timeout=10,
                    )
                    return False, "misconfigured", f"Le domaine {domain} n'a pas de DNS pointant vers Vercel."
        except Exception as e:
            logger.warning("Error checking domain config for %s: %s", domain, e)
            return False, "error", str(e)

        return True, "configured", None

    # ── Redeploy ───────────────────────────────────────────────────────────

    async def redeploy_store(self, store_id: str, html: str, seo: dict) -> str:
        """
        Push the updated files to GitHub, then trigger a new deployment
        on the existing Vercel project. Returns the public URL.
        """
        supabase = get_supabase()
        store = (
            supabase.table("stores")
            .select("*")
            .eq("id", store_id)
            .single()
            .execute()
            .data
        )
        if not store:
            raise ValueError(f"Store {store_id} not found")

        self._ensure_required_tokens()
        slug      = store["slug"]
        repo_name = f"store-{slug}"
        owner     = self._require_configured_owner()
        project_id = store.get("vercel_project_id")
        if not project_id:
            raise ValueError(
                "No Vercel project linked to this store — run a full deploy first."
            )

        async with httpx.AsyncClient(timeout=60.0) as http:
            logger.info(
                "Redeploy start store_id=%s owner=%s repo=%s project_id=%s",
                store_id, owner, repo_name, project_id,
            )
            await self._upsert_github_file(http, owner, repo_name, "index.html", html)
            # Keep the repo copy of the client runtime in sync on redeploys so
            # the gitSource path (and any manual Vercel deploys) stay identical
            # to the upload path.
            for name, content in _load_store_assets():
                await self._upsert_github_file(http, owner, repo_name, name, content)
            url, deploy_id = await self._trigger_deployment(
                http, project_id, owner, repo_name, html,
            )
            canonical_url = store.get("published_url") or f"https://{repo_name}.vercel.app"
            if "storegen.shop" in canonical_url:
                canonical_url = f"https://{repo_name}.vercel.app"
            supabase.table("stores").update({
                "published_url": canonical_url,
            }).eq("id", store_id).execute()
            logger.info("Store %s redeployed: %s", store_id, canonical_url)
            return canonical_url
