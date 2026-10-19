#!/usr/bin/env python3
"""
Script d'audit en lecture seule des commandes suspectes.
Identifie les commandes existantes dont le montant total_amount est :
1. Inférieur à 100 DZD
2. OU inférieur à 50 % du prix actuel en base des produits commandés multiplié par la quantité.

Ce script n'effectue AUCUNE écriture ni modification en base de données (requêtes SELECT uniquement).
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any, Dict, List

from dotenv import load_dotenv

# Chargement des variables d'environnement
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


def get_supabase():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[!] Clés Supabase introuvables dans l'environnement.")
        return None
    from supabase import create_client
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def audit_orders():
    print("=" * 80)
    print("AUDIT EN LECTURE SEULE DES COMMANDES EXISTANTES")
    print("Critères : total_amount < 100 DZD OU total_amount < 50% du prix produit en base")
    print("=" * 80)

    supabase = get_supabase()
    if not supabase:
        return 1

    # 1. Récupération des boutiques (SELECT uniquement)
    stores_res = supabase.table("stores").select("id, name, slug").execute()
    stores_map = {s["id"]: s.get("name") or s.get("slug") or s["id"] for s in (stores_res.data or [])}

    # 2. Récupération des produits (SELECT uniquement)
    products_res = supabase.table("products").select("id, name, price, store_id").execute()
    products_map = {p["id"]: float(p.get("price") or 0.0) for p in (products_res.data or [])}

    # 3. Récupération des commandes (SELECT uniquement)
    orders_res = supabase.table("orders").select(
        "id, store_id, customer_name, customer_phone, items, total_amount, status, created_at"
    ).order("created_at", desc=True).execute()

    orders = orders_res.data or []
    print(f"[*] {len(orders)} commande(s) analysée(s) au total.\n")

    suspicious_orders: List[Dict[str, Any]] = []

    for o in orders:
        order_id = o.get("id")
        store_id = o.get("store_id")
        store_name = stores_map.get(store_id, f"Boutique inconnue ({store_id})")
        created_at = o.get("created_at") or "N/A"
        raw_total = o.get("total_amount")
        total_amount = float(raw_total) if raw_total is not None else 0.0

        items = o.get("items") or []
        expected_items_total = 0.0
        has_matched_product = False

        for item in items:
            p_id = str(item.get("product_id") or item.get("id") or "")
            qty = max(1, int(item.get("quantity") or item.get("qty") or 1))
            if p_id in products_map:
                has_matched_product = True
                expected_items_total += products_map[p_id] * qty

        reasons = []

        if total_amount < 100.0:
            reasons.append(f"Montant < 100 DZD ({total_amount} DZD)")

        if has_matched_product and expected_items_total > 0:
            threshold_50 = 0.5 * expected_items_total
            if total_amount < threshold_50:
                reasons.append(
                    f"Montant ({total_amount} DZD) < 50% du prix base ({expected_items_total} DZD, seuil: {threshold_50} DZD)"
                )

        if reasons:
            suspicious_orders.append({
                "id": order_id,
                "store_name": store_name,
                "store_id": store_id,
                "created_at": created_at,
                "total_amount": total_amount,
                "expected_items_total": expected_items_total,
                "reasons": reasons,
                "customer_name": o.get("customer_name"),
                "status": o.get("status"),
            })

    print("=" * 80)
    print(f"RÉSULTAT DE L'AUDIT : {len(suspicious_orders)} COMMANDE(S) SUSPECTE(S) DÉTECTÉE(S)")
    print("=" * 80)

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    if not suspicious_orders:
        print("[OK] Aucune commande suspecte detectee dans la base.")
    else:
        for idx, so in enumerate(suspicious_orders, start=1):
            print(f"\n[{idx}] Commande ID   : {so['id']}")
            print(f"    Boutique      : {so['store_name']}")
            print(f"    Date          : {so['created_at']}")
            print(f"    Montant total : {so['total_amount']} DZD")
            print(f"    Statut        : {so['status']}")
            print(f"    Client        : {so['customer_name']}")
            print(f"    Motif(s)      : {' | '.join(so['reasons'])}")

    print("\n" + "-" * 80)
    print("DETAIL DES 9 COMMANDES EXISTANTES EN BASE :")
    print("-" * 80)
    for o in orders:
        s_name = stores_map.get(o.get("store_id"), "Inconnue")
        print(f"• ID: {o.get('id')} | Boutique: {s_name} | Date: {o.get('created_at')} | Montant: {o.get('total_amount')} DZD | Statut: {o.get('status')}")

    print("\n" + "=" * 80)
    print("[Note de securite] Script strictement en lecture seule. Aucune ecriture effectuee.")
    print("=" * 80)
    return 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(audit_orders())

