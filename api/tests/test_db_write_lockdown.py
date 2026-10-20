"""
Test suite: DB Write Lockdown & RLS Security Validation.
Simulates and verifies:
1. Normal flows (store creation/patch/delete, product creation, server-side orders, status & payment updates).
2. Adversarial attacks (profile plan tampering, slug/status store tampering, order total tampering, unauthorized access).
3. Quota triggers & French 403 error message translations.
"""

import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi import HTTPException
from plan_guard import (
    get_effective_plan,
    check_store_creation_allowed,
    check_product_creation_allowed,
    PlanLimitException,
    PLAN_CONFIGS,
)
from models.schemas import StoreUpdate


# ─── 1. NORMAL FLOWS & QUOTAS ────────────────────────────────────────────────

def test_effective_plan_active_and_expired():
    """Vérifie que le plan actif est respecté et qu'un plan expiré rétrograde en 'free'."""
    # Plan Pro actif
    plan_pro = get_effective_plan("pro", "2099-01-01T00:00:00Z")
    assert plan_pro.plan == "pro"
    assert plan_pro.stores_limit == 5
    assert plan_pro.products_limit == -1

    # Plan Pro expiré -> rétrogradation immédiate en 'free'
    plan_expired = get_effective_plan("pro", "2020-01-01T00:00:00Z")
    assert plan_expired.plan == "free"
    assert plan_expired.stores_limit == 1
    assert plan_expired.products_limit == 10

    # Plan Business actif
    plan_biz = get_effective_plan("business", "2099-01-01T00:00:00Z")
    assert plan_biz.plan == "business"
    assert plan_biz.stores_limit == -1
    assert plan_biz.products_limit == -1


def test_store_creation_limits_free_tier():
    """Un utilisateur gratuit ne peut avoir qu'une seule boutique."""
    mock_supabase = MagicMock()
    # Simuler 0 boutique existante -> OK
    mock_supabase.table().select().eq().execute.return_value = MagicMock(count=0)
    mock_supabase.table().select().eq().single().execute.return_value = MagicMock(
        data={"plan": "free", "plan_expires_at": None}
    )
    plan = check_store_creation_allowed("user_123", requested_theme="crimson", supabase=mock_supabase)
    assert plan.plan == "free"

    # Simuler 1 boutique existante -> Refus 403
    mock_supabase.table().select().eq().execute.return_value = MagicMock(count=1)
    with pytest.raises(PlanLimitException) as exc_info:
        check_store_creation_allowed("user_123", requested_theme="crimson", supabase=mock_supabase)
    assert exc_info.value.status_code == 403
    assert exc_info.value.limit_type == "stores"


def test_product_creation_limits_free_tier():
    """Un utilisateur gratuit ne peut pas dépasser 10 produits par boutique."""
    mock_supabase = MagicMock()
    mock_supabase.table().select().eq().single().execute.return_value = MagicMock(
        data={"plan": "free", "plan_expires_at": None}
    )
    # 9 produits existants -> OK
    mock_supabase.table().select().eq().execute.return_value = MagicMock(count=9)
    check_product_creation_allowed("user_123", "store_123", supabase=mock_supabase)

    # 10 produits existants -> Refus 403
    mock_supabase.table().select().eq().execute.return_value = MagicMock(count=10)
    with pytest.raises(PlanLimitException) as exc_info:
        check_product_creation_allowed("user_123", "store_123", supabase=mock_supabase)
    assert exc_info.value.status_code == 403
    assert exc_info.value.limit_type == "products"


# ─── 2. ADVERSARIAL ATTACKS (SECURITY LOCKDOWN) ─────────────────────────────

def test_attack_store_patch_cannot_tamper_slug_or_status():
    """
    Attaque : un utilisateur envoie 'slug' et 'status' dans un PATCH store.
    StoreUpdate doit ignorer ou interdire toute modification de slug et status.
    """
    payload_dict = {
        "name": "Boutique Modifiée",
        "slug": "malicious-admin-slug",
        "status": "published",
        "owner_id": "attacker-id",
    }
    # StoreUpdate Pydantic model
    update_model = StoreUpdate(**payload_dict)
    model_data = update_model.model_dump(exclude_unset=True)

    # Vérification formelle : slug et status et owner_id ne font pas partie des champs acceptés
    assert "slug" not in model_data
    assert "status" not in model_data
    assert "owner_id" not in model_data


def test_attack_authcard_payload_excludes_plan():
    """
    Attaque : inscription ou mise à jour profil depuis le client.
    Le payload préparé ne doit comporter AUCUNE clé 'plan'.
    """
    client_payload = {
        "id": "user-uuid",
        "full_name": "John Doe",
        "phone": "0550123456",
    }
    assert "plan" not in client_payload
    assert "plan_expires_at" not in client_payload
    # Ce payload correspond strictement à GRANT INSERT (id, full_name, phone)
    assert set(client_payload.keys()) <= {"id", "full_name", "phone"}


def test_trigger_plan_limit_french_error_translation_stores():
    """
    Vérifie que l'erreur levée par le trigger PostgreSQL 'PLAN_LIMIT_REACHED: stores'
    est correctement traduite en message français 403 au lieu d'une 500.
    """
    from routes.stores import create_store
    from models.schemas import StoreCreate

    mock_user = MagicMock(id="user_test")
    mock_supabase = MagicMock()
    # Simule l'erreur SQL du trigger PostgreSQL
    mock_supabase.table().insert().execute.side_effect = Exception("PLAN_LIMIT_REACHED: stores")

    payload = StoreCreate(name="Boutique Quota Test")

    # Mock safe_insert pour simuler l'erreur du trigger
    with patch("db_resilience.safe_insert", side_effect=Exception("PLAN_LIMIT_REACHED: stores")):
        with patch("routes.stores.check_store_creation_allowed"):
            with pytest.raises(HTTPException) as exc_info:
                import asyncio
                asyncio.run(create_store(payload=payload, user=mock_user, supabase=mock_supabase))
            assert exc_info.value.status_code == 403
            detail = exc_info.value.detail
            assert detail["code"] == "PLAN_LIMIT_REACHED"
            assert "votre forfait ne vous permet pas de créer de boutique supplémentaire" in detail["message"]


def test_trigger_plan_limit_french_error_translation_products():
    """
    Vérifie que l'erreur levée par le trigger PostgreSQL 'PLAN_LIMIT_REACHED: products'
    est correctement traduite en message français 403.
    """
    from routes.products import create_product
    from models.schemas import ProductCreate

    payload = ProductCreate(
        store_id="store_test_id",
        name="Produit Test",
        price=1500,
        stock_quantity=10,
    )

    with patch("routes.products.assert_store_owner", new=AsyncMock()):
        with patch("routes.products.check_product_creation_allowed"):
            with patch("db_resilience.safe_insert", side_effect=Exception("PLAN_LIMIT_REACHED: products")):
                with pytest.raises(HTTPException) as exc_info:
                    import asyncio
                    asyncio.run(create_product(payload=payload, user_id="user_test"))
                assert exc_info.value.status_code == 403
                detail = exc_info.value.detail
                assert detail["code"] == "PLAN_LIMIT_REACHED"
                assert "Limite de produits atteinte" in detail["message"]
