import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException
from pydantic import ValidationError

from routes.orders import (
    CreateOrderRequest,
    create_order,
    MIN_QTY_PER_ITEM,
    MAX_QTY_PER_ITEM,
    MAX_ITEMS_PER_ORDER,
)


def build_mock_supabase(
    store=None,
    product=None,
    shipping_rate=None,
    wilaya=None,
    inserted_order_id="ord-test-123456",
):
    mock = MagicMock()
    captured_inserts = []

    default_store = {
        "id": "store-valid-01",
        "name": "Boutique Officielle",
        "status": "published",
        "settings": {},
    }
    effective_store = store if store is not None else default_store

    default_product = {
        "id": "prod-100",
        "name": "Montre Chrono Luxe",
        "price": 5000.0,
        "status": "active",
        "store_id": effective_store["id"] if effective_store else "store-valid-01",
        "images": ["https://example.com/watch.jpg"],
        "options": [],
        "stock_quantity": 25,
    }
    effective_product = product if product is not None else default_product

    default_rate = {
        "store_id": effective_store["id"] if effective_store else "store-valid-01",
        "wilaya_id": 16,
        "price_home": 600.0,
        "price_desk": 350.0,
    }
    effective_rate = shipping_rate if shipping_rate is not None else default_rate

    default_wilaya = {
        "id": 16,
        "name": "Alger",
        "price_home": 500.0,
        "price_desk": 300.0,
    }
    effective_wilaya = wilaya if wilaya is not None else default_wilaya

    def get_table(name):
        tbl = MagicMock()
        tbl.select.return_value = tbl
        tbl.eq.return_value = tbl
        tbl.gte.return_value = tbl
        tbl.order.return_value = tbl
        tbl.single.return_value = tbl
        tbl.update.return_value = tbl

        if name == "stores":
            data = [effective_store] if effective_store else []
            tbl.execute.return_value = MagicMock(data=data)
        elif name == "products":
            data = [effective_product] if effective_product else []
            tbl.execute.return_value = MagicMock(data=data)
        elif name == "shipping_rates":
            data = [effective_rate] if effective_rate else []
            tbl.execute.return_value = MagicMock(data=data)
        elif name == "wilayas":
            data = [effective_wilaya] if effective_wilaya else []
            tbl.execute.return_value = MagicMock(data=data)
        elif name == "orders":
            def do_insert(payload):
                captured_inserts.append(payload)
                ins_mock = MagicMock()
                saved_row = dict(payload)
                saved_row["id"] = inserted_order_id
                ins_mock.execute.return_value = MagicMock(data=[saved_row])
                return ins_mock

            tbl.insert.side_effect = do_insert
            tbl.execute.return_value = MagicMock(data=[{"id": inserted_order_id}])
        else:
            tbl.execute.return_value = MagicMock(data=[])

        return tbl

    mock.table.side_effect = get_table
    mock._captured_inserts = captured_inserts
    return mock


@pytest.mark.anyio
async def test_1_client_total_amount_ignored():
    """1. total_amount: 1 envoyé par le client -> Le serveur recalcule et enregistre le montant exact."""
    mock_sb = build_mock_supabase()
    # Produit: 5000 DZD, Qty: 2, Livraison: 600 DZD. Montant attendu = 10600 DZD
    req = CreateOrderRequest(
        store_id="store-valid-01",
        customer_name="Amine Belkacem",
        customer_phone="0550123456",
        customer_address="12 Rue Didouche Mourad, Alger",
        wilaya_id=16,
        ship_mode="domicile",
        total_amount=1.0,  # Tentative de falsification du montant global
        items=[{"product_id": "prod-100", "qty": 2, "price": 1.0}],
    )

    res = await create_order(req, supabase=mock_sb)
    assert res["total_amount"] == 10600.0
    assert res["subtotal"] == 10000.0
    assert res["shipping_fee"] == 600.0

    # Vérification que le montant enregistré en base est bien celui calculé par le serveur
    assert len(mock_sb._captured_inserts) == 1
    inserted = mock_sb._captured_inserts[0]
    assert inserted["total_amount"] == 10600.0


@pytest.mark.anyio
async def test_2_client_item_price_ignored():
    """2. items[].price: 1 envoyé par le client -> Le serveur ignore le prix client et utilise le prix en base."""
    mock_sb = build_mock_supabase()
    # Produit en base à 5000 DZD, client déclare 1 DZD
    req = CreateOrderRequest(
        store_id="store-valid-01",
        customer_name="Amine Belkacem",
        customer_phone="0661123456",
        customer_address="12 Rue Didouche Mourad, Alger",
        wilaya_id=16,
        ship_mode="domicile",
        total_amount=999999.0,  # Faux total
        items=[{"product_id": "prod-100", "qty": 1, "price": 1.0}],
    )

    res = await create_order(req, supabase=mock_sb)
    assert res["subtotal"] == 5000.0
    assert res["total_amount"] == 5600.0

    inserted_item = mock_sb._captured_inserts[0]["items"][0]
    assert inserted_item["price"] == 5000.0


@pytest.mark.anyio
async def test_3_quantity_zero_rejected():
    """3. Quantité 0 -> Refus HTTP 400."""
    mock_sb = build_mock_supabase()
    req = CreateOrderRequest(
        store_id="store-valid-01",
        customer_name="Amine Belkacem",
        customer_phone="0770123456",
        customer_address="12 Rue Didouche Mourad, Alger",
        wilaya_id=16,
        items=[{"product_id": "prod-100", "qty": 0}],
    )
    with pytest.raises(HTTPException) as exc:
        await create_order(req, supabase=mock_sb)
    assert exc.value.status_code == 400
    assert f"entre {MIN_QTY_PER_ITEM} et {MAX_QTY_PER_ITEM}" in exc.value.detail


@pytest.mark.anyio
async def test_4_quantity_negative_rejected():
    """4. Quantité négative (-1) -> Refus HTTP 400."""
    mock_sb = build_mock_supabase()
    req = CreateOrderRequest(
        store_id="store-valid-01",
        customer_name="Amine Belkacem",
        customer_phone="0770123456",
        customer_address="12 Rue Didouche Mourad, Alger",
        wilaya_id=16,
        items=[{"product_id": "prod-100", "qty": -1}],
    )
    with pytest.raises(HTTPException) as exc:
        await create_order(req, supabase=mock_sb)
    assert exc.value.status_code == 400
    assert f"entre {MIN_QTY_PER_ITEM} et {MAX_QTY_PER_ITEM}" in exc.value.detail


@pytest.mark.anyio
async def test_5_quantity_9999_rejected():
    """5. Quantité 9999 (> 10) -> Refus HTTP 400."""
    mock_sb = build_mock_supabase()
    req = CreateOrderRequest(
        store_id="store-valid-01",
        customer_name="Amine Belkacem",
        customer_phone="0770123456",
        customer_address="12 Rue Didouche Mourad, Alger",
        wilaya_id=16,
        items=[{"product_id": "prod-100", "qty": 9999}],
    )
    with pytest.raises(HTTPException) as exc:
        await create_order(req, supabase=mock_sb)
    assert exc.value.status_code == 400
    assert f"entre {MIN_QTY_PER_ITEM} et {MAX_QTY_PER_ITEM}" in exc.value.detail


@pytest.mark.anyio
async def test_6_product_from_another_store_rejected():
    """6. Produit appartenant à une autre boutique -> Refus HTTP 400."""
    alien_product = {
        "id": "prod-alien",
        "name": "Produit Pirate",
        "price": 3000.0,
        "status": "active",
        "store_id": "store-OTHER-999",  # N'appartient pas à store-valid-01
        "images": [],
        "options": [],
        "stock_quantity": 10,
    }
    mock_sb = build_mock_supabase(product=alien_product)
    req = CreateOrderRequest(
        store_id="store-valid-01",
        customer_name="Amine Belkacem",
        customer_phone="0550123456",
        customer_address="12 Rue Didouche Mourad, Alger",
        wilaya_id=16,
        items=[{"product_id": "prod-alien", "qty": 1}],
    )
    with pytest.raises(HTTPException) as exc:
        await create_order(req, supabase=mock_sb)
    assert exc.value.status_code == 400
    assert "n'appartient pas à cette boutique" in exc.value.detail


@pytest.mark.anyio
async def test_7_inactive_product_rejected():
    """7. Produit inactif (status == 'draft' ou 'archived') -> Refus HTTP 400."""
    draft_product = {
        "id": "prod-draft",
        "name": "Produit Inactif",
        "price": 4000.0,
        "status": "draft",  # Inactif
        "store_id": "store-valid-01",
        "images": [],
        "options": [],
        "stock_quantity": 5,
    }
    mock_sb = build_mock_supabase(product=draft_product)
    req = CreateOrderRequest(
        store_id="store-valid-01",
        customer_name="Amine Belkacem",
        customer_phone="0550123456",
        customer_address="12 Rue Didouche Mourad, Alger",
        wilaya_id=16,
        items=[{"product_id": "prod-draft", "qty": 1}],
    )
    with pytest.raises(HTTPException) as exc:
        await create_order(req, supabase=mock_sb)
    assert exc.value.status_code == 400
    assert "n'est pas actif" in exc.value.detail


@pytest.mark.anyio
async def test_8_unknown_wilaya_rejected():
    """8. Wilaya inconnue (wilaya_id: 999) -> Refus HTTP 400."""
    mock_sb = build_mock_supabase()
    req = CreateOrderRequest(
        store_id="store-valid-01",
        customer_name="Amine Belkacem",
        customer_phone="0550123456",
        customer_address="12 Rue Didouche Mourad, Alger",
        wilaya_id=999,  # Inconnu (> 58)
        items=[{"product_id": "prod-100", "qty": 1}],
    )
    with pytest.raises(HTTPException) as exc:
        await create_order(req, supabase=mock_sb)
    assert exc.value.status_code == 400
    assert "invalide ou inconnue" in exc.value.detail


@pytest.mark.anyio
async def test_9_unpublished_store_rejected():
    """9. Boutique non publiée (status == 'draft') -> Refus HTTP 400."""
    draft_store = {
        "id": "store-draft-01",
        "name": "Boutique en Brouillon",
        "status": "draft",  # Non publiée
        "settings": {},
    }
    mock_sb = build_mock_supabase(store=draft_store)
    req = CreateOrderRequest(
        store_id="store-draft-01",
        customer_name="Amine Belkacem",
        customer_phone="0550123456",
        customer_address="12 Rue Didouche Mourad, Alger",
        wilaya_id=16,
        items=[{"product_id": "prod-100", "qty": 1}],
    )
    with pytest.raises(HTTPException) as exc:
        await create_order(req, supabase=mock_sb)
    assert exc.value.status_code == 400
    assert "statut non publié" in exc.value.detail


@pytest.mark.anyio
async def test_10_normal_order_success():
    """10. Cas normal -> Validation complète, retour HTTP 200, montant calculé par le serveur."""
    # Custom rate boutique: Alger domicile = 650 DZD
    custom_rate = {
        "store_id": "store-valid-01",
        "wilaya_id": 16,
        "price_home": 650.0,
        "price_desk": 400.0,
    }
    mock_sb = build_mock_supabase(shipping_rate=custom_rate)

    req = CreateOrderRequest(
        store_id="store-valid-01",
        customer_name="Yacine Meziane",
        customer_phone="+213 555 98 76 54",  # Format international algérien
        customer_address="Cité 500 Logements, Bab Ezzouar",
        wilaya_id=16,
        ship_mode="domicile",
        notes="Appeler avant de livrer s'il vous plaît",
        items=[
            {"product_id": "prod-100", "qty": 3, "price": 0.0},  # Client envoie 0
        ],
    )

    res = await create_order(req, supabase=mock_sb)
    # Calcul attendu : 3 * 5000 + 650 = 15650 DZD
    assert res["subtotal"] == 15000.0
    assert res["shipping_fee"] == 650.0
    assert res["total_amount"] == 15650.0
    assert res["order_id"] == "ord-test-123456"

    # Vérification en base
    saved = mock_sb._captured_inserts[0]
    assert saved["total_amount"] == 15650.0
    assert saved["customer_phone"] == "0555987654"
    assert saved["notes"] == "Appeler avant de livrer s'il vous plaît"
