#!/usr/bin/env python3
"""
Script d'audit en lecture seule des ressources orphelines (GitHub & Vercel).
Identifie les dépôts 'store-*' et les projets Vercel qui ne correspondent
à aucune ligne dans la table 'stores' de Supabase.

Ce script ne modifie rien en base de données et ne supprime aucune ressource distante.
"""

from __future__ import annotations

import os
import sys
import argparse
from pathlib import Path
from typing import Any, Dict, List, Set

import httpx
from dotenv import load_dotenv

# Chargement de l'environnement depuis api/.env ou .env
CURRENT_DIR = Path(__file__).resolve().parent
API_DIR = CURRENT_DIR.parent
ROOT_DIR = API_DIR.parent

load_dotenv(API_DIR / ".env")
load_dotenv(ROOT_DIR / ".env")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "").strip()
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_KEY", "").strip()
    or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "").strip()
)

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "").strip()
GITHUB_ORG = os.getenv("GITHUB_ORG", "").strip()
GITHUB_OWNER = os.getenv("GITHUB_OWNER", "").strip() or GITHUB_ORG

VERCEL_TOKEN = os.getenv("VERCEL_TOKEN", "").strip()
VERCEL_TEAM_ID = os.getenv("VERCEL_TEAM_ID", "").strip()


def get_supabase_client():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[!] Erreur : Clés Supabase manquantes (NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_KEY).")
        return None
    try:
        from supabase import create_client
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"[!] Erreur initialisation Supabase : {e}")
        return None


def fetch_all_db_stores(supabase) -> List[Dict[str, Any]]:
    """Récupère toutes les boutiques enregistrées en base (lecture seule)."""
    try:
        res = supabase.table("stores").select(
            "id, name, slug, status, github_repo, vercel_project_id, published_url"
        ).execute()
        return res.data or []
    except Exception as e:
        print(f"[!] Erreur lors de la lecture des boutiques Supabase : {e}")
        return []


def fetch_github_repos(owner: str, token: str) -> List[Dict[str, Any]]:
    """Récupère la liste des dépôts GitHub (lecture seule avec pagination)."""
    if not token:
        print("[!] Aucun GITHUB_TOKEN configuré. Audit GitHub ignoré.")
        return []

    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
    }
    all_repos: List[Dict[str, Any]] = []
    page = 1
    per_page = 100

    with httpx.Client(timeout=30.0) as client:
        while True:
            # Si un owner spécifique est défini et différent de l'utilisateur authentifié
            if owner and GITHUB_ORG:
                url = f"https://api.github.com/orgs/{owner}/repos?per_page={per_page}&page={page}"
            else:
                url = f"https://api.github.com/user/repos?per_page={per_page}&page={page}&affiliation=owner,collaborator"

            resp = client.get(url, headers=headers)
            if resp.status_code == 404 and owner:
                # Fallback sur l'utilisateur
                url = f"https://api.github.com/users/{owner}/repos?per_page={per_page}&page={page}"
                resp = client.get(url, headers=headers)

            if resp.status_code != 200:
                print(f"[!] Erreur GitHub API (HTTP {resp.status_code}) : {resp.text[:200]}")
                break

            data = resp.json()
            if not isinstance(data, list) or len(data) == 0:
                break

            all_repos.extend(data)
            if len(data) < per_page:
                break
            page += 1

    return all_repos


def fetch_vercel_projects(token: str, team_id: str = "") -> List[Dict[str, Any]]:
    """Récupère la liste des projets Vercel (lecture seule avec pagination)."""
    if not token:
        print("[!] Aucun VERCEL_TOKEN configuré. Audit Vercel ignoré.")
        return []

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    all_projects: List[Dict[str, Any]] = []
    until = None

    with httpx.Client(timeout=30.0) as client:
        while True:
            url = "https://api.vercel.com/v9/projects?limit=100"
            if team_id:
                url += f"&teamId={team_id}"
            if until:
                url += f"&until={until}"

            resp = client.get(url, headers=headers)
            if resp.status_code != 200:
                print(f"[!] Erreur Vercel API (HTTP {resp.status_code}) : {resp.text[:200]}")
                break

            data = resp.json()
            projects = data.get("projects", [])
            if not projects:
                break

            all_projects.extend(projects)
            pagination = data.get("pagination", {})
            next_until = pagination.get("next")
            if not next_until or next_until == until:
                break
            until = next_until

    return all_projects


def audit_orphans():
    print("=" * 70)
    print("AUDIT EN LECTURE SEULE DES RESSOURCES ORPHELINES (GitHub & Vercel)")
    print("=" * 70)

    supabase = get_supabase_client()
    if not supabase:
        print("Arrêt de l'audit : connexion Supabase impossible.")
        return 1

    # 1. Lecture de la base Supabase
    stores = fetch_all_db_stores(supabase)
    print(f"[*] {len(stores)} boutique(s) répertoriée(s) dans la base Supabase.\n")

    db_slugs: Set[str] = set()
    db_expected_names: Set[str] = set()
    db_repos: Set[str] = set()
    db_vercel_ids: Set[str] = set()

    for s in stores:
        slug = (s.get("slug") or "").strip().lower()
        if slug:
            db_slugs.add(slug)
            db_expected_names.add(f"store-{slug}")

        repo_val = (s.get("github_repo") or "").strip()
        if repo_val:
            repo_name = repo_val.rstrip("/").split("/")[-1].lower()
            db_repos.add(repo_name)

        v_id = (s.get("vercel_project_id") or "").strip()
        if v_id:
            db_vercel_ids.add(v_id)

    # 2. Audit des dépôts GitHub
    print("[*] Interrogation des dépôts GitHub...")
    github_repos = fetch_github_repos(GITHUB_OWNER, GITHUB_TOKEN)
    store_repos = [r for r in github_repos if r.get("name", "").startswith("store-")]
    print(f"[*] {len(github_repos)} dépôts GitHub au total, dont {len(store_repos)} avec préfixe 'store-'.")

    orphan_repos: List[Dict[str, Any]] = []
    for r in store_repos:
        name = r.get("name", "").lower()
        # Un dépôt est orphelin s'il ne correspond à aucun slug connu ni aucun champ github_repo
        if name not in db_expected_names and name not in db_repos:
            orphan_repos.append(r)

    # 3. Audit des projets Vercel
    print("\n[*] Interrogation des projets Vercel...")
    vercel_projects = fetch_vercel_projects(VERCEL_TOKEN, VERCEL_TEAM_ID)
    store_projects = [p for p in vercel_projects if p.get("name", "").startswith("store-")]
    print(f"[*] {len(vercel_projects)} projets Vercel au total, dont {len(store_projects)} avec préfixe 'store-'.")

    orphan_projects: List[Dict[str, Any]] = []
    for p in store_projects:
        p_id = p.get("id", "")
        p_name = p.get("name", "").lower()

        # Un projet Vercel est orphelin si ni son ID ni son nom ne correspondent à un store DB
        if p_id not in db_vercel_ids and p_name not in db_expected_names and p_name not in db_repos:
            orphan_projects.append(p)

    # 4. Affichage du Rapport d'Audit
    print("\n" + "=" * 70)
    print("RÉSULTATS DE L'AUDIT ORPHELINS (LECTURE SEULE)")
    print("=" * 70)

    print(f"\n1. DÉPÔTS GITHUB ORPHELINS : {len(orphan_repos)} détecté(s)")
    if orphan_repos:
        for r in orphan_repos:
            created = r.get("created_at", "N/A")
            url = r.get("html_url", "")
            print(f"   - {r.get('name')} | Créé le: {created} | URL: {url}")
    else:
        print("   ✓ Aucun dépôt GitHub 'store-*' orphelin trouvé.")

    print(f"\n2. PROJETS VERCEL ORPHELINS : {len(orphan_projects)} détecté(s)")
    if orphan_projects:
        for p in orphan_projects:
            created = p.get("createdAt", "N/A")
            p_id = p.get("id", "")
            print(f"   - {p.get('name')} (ID: {p_id}) | Créé le: {created}")
    else:
        print("   ✓ Aucun projet Vercel 'store-*' orphelin trouvé.")

    print("\n" + "=" * 70)
    print("[Note de sécurité] Aucune opération d'écriture ou de suppression n'a été effectuée.")
    print("=" * 70)
    return 0


if __name__ == "__main__":
    sys.exit(audit_orphans())
