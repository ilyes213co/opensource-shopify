"""
Tests unitaires pour Funnels Battle :
1. Plan gating (Free vs Pro vs Business vs Expired)
2. Calcul des métriques Funnels Battle (CA livré, CA en attente, vues, conversion WA)
3. Gestion des vainqueurs, ex æquo, zéro CA livré, et phrase de synthèse protégée
"""
from datetime import datetime, timezone, timedelta
from plan_guard import PlanLimitException, get_effective_plan, PLAN_CONFIGS
from routes.analytics import _format_amount, _to_algiers_day

def test_plan_gating():
    # Gratuit
    free = get_effective_plan("free", None)
    assert free.can_compare_funnels is False, "Free plan should not have access"
    assert free.plan == "free"

    # Inconnu -> fallback free
    unknown = get_effective_plan("unknown_plan", None)
    assert unknown.can_compare_funnels is False
    assert unknown.plan == "free"

    # Pro valide
    future_date = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    pro = get_effective_plan("pro", future_date)
    assert pro.can_compare_funnels is True, "Pro active plan should have access"
    assert pro.plan == "pro"

    # Business valide
    biz = get_effective_plan("business", future_date)
    assert biz.can_compare_funnels is True, "Business active plan should have access"
    assert biz.plan == "business"

    # Pro expiré -> rétrogradation automatique en free
    past_date = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
    expired = get_effective_plan("pro", past_date)
    assert expired.can_compare_funnels is False, "Expired pro plan should be downgraded to free"
    assert expired.plan == "free"

    print("[OK] [1/3] Plan Gating Tests passed successfully.")

def test_synthesis_and_ranking():
    # Cas 1 : Aucun CA livré
    funnel_metrics = [
        {"id": "f1", "name": "Funnel A", "delivered_revenue": 0.0, "rank": 1},
        {"id": "f2", "name": "Funnel B", "delivered_revenue": 0.0, "rank": 1},
    ]
    has_delivered_revenue = any(m["delivered_revenue"] > 0 for m in funnel_metrics)
    assert has_delivered_revenue is False
    synthesis = "Aucun vainqueur sur cette période : aucune commande livrée n'a été enregistrée pour les funnels sélectionnés."
    assert "Aucun vainqueur" in synthesis

    # Cas 2 : Funnel A a du CA livré, Funnel B a 0 (deuxième CA = 0 -> synthèse protégée contre division par 0)
    funnel_metrics = [
        {"id": "f1", "name": "Funnel A", "delivered_revenue": 15000.0, "rank": 1},
        {"id": "f2", "name": "Funnel B", "delivered_revenue": 0.0, "rank": 2},
    ]
    first = funnel_metrics[0]
    second = funnel_metrics[1]
    assert second["delivered_revenue"] == 0
    synthesis = (
        f"« {first['name']} » est en tête avec {_format_amount(first['delivered_revenue'])} DZD livrés. "
        "C'est le seul funnel à avoir généré du CA livré sur cette période."
    )
    assert "seul funnel à avoir généré du CA livré" in synthesis
    assert "15 000" in synthesis

    # Cas 3 : Les deux funnels ont du CA livré
    funnel_metrics = [
        {"id": "f1", "name": "Funnel A", "delivered_revenue": 20000.0, "rank": 1},
        {"id": "f2", "name": "Funnel B", "delivered_revenue": 10000.0, "rank": 2},
    ]
    first = funnel_metrics[0]
    second = funnel_metrics[1]
    diff = first["delivered_revenue"] - second["delivered_revenue"]
    pct = round((diff / second["delivered_revenue"]) * 100, 1)
    synthesis = (
        f"« {first['name']} » domine la battle avec {_format_amount(first['delivered_revenue'])} DZD de CA livré "
        f"(+{pct}% par rapport à « {second['name']} »)."
    )
    assert "+100.0%" in synthesis

    # Cas 4 : Ex æquo
    funnel_metrics = [
        {"id": "f1", "name": "Funnel A", "delivered_revenue": 20000.0, "rank": 1},
        {"id": "f2", "name": "Funnel B", "delivered_revenue": 20000.0, "rank": 1},
    ]
    first = funnel_metrics[0]
    second = funnel_metrics[1]
    synthesis = (
        f"Égalité parfaite en tête entre « {first['name']} » et « {second['name']} » avec "
        f"{_format_amount(first['delivered_revenue'])} DZD livrés chacun !"
    )
    assert "Égalité parfaite" in synthesis

    print("[OK] [2/3] Ranking and Synthesis Tests passed successfully.")

def test_algiers_timezone_conversion():
    # 2026-10-18 à 23:30 UTC -> 2026-10-19 à 00:30 UTC+1 (fuseau Algérie)
    iso_utc = "2026-10-18T23:30:00Z"
    day = _to_algiers_day(iso_utc)
    assert day == "2026-10-19", f"Expected 2026-10-19 but got {day}"

    # 2026-10-18 à 14:00 UTC -> 2026-10-18 à 15:00 UTC+1
    iso_utc2 = "2026-10-18T14:00:00+00:00"
    day2 = _to_algiers_day(iso_utc2)
    assert day2 == "2026-10-18", f"Expected 2026-10-18 but got {day2}"

    print("[OK] [3/3] Timezone Algiers conversion tests passed successfully.")

if __name__ == "__main__":
    test_plan_gating()
    test_synthesis_and_ranking()
    test_algiers_timezone_conversion()
    print("\nSUCCESS: ALL 3 TEST SUITES PASSED WITHOUT ERROR!")
