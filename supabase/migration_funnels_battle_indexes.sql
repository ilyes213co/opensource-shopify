-- ==============================================================================
-- Migration: Index de performance pour Funnels Battle
-- Permet des requêtes de comparaison multi-funnels rapides sans scan séquentiel.
-- ==============================================================================

-- 1. Index store_analytics : filtrage rapide par store_id, event_type et created_at
CREATE INDEX IF NOT EXISTS idx_store_analytics_battle_perf
  ON public.store_analytics(store_id, event_type, created_at DESC);

-- 2. Index orders : filtrage rapide par store_id, status et created_at
CREATE INDEX IF NOT EXISTS idx_orders_battle_perf
  ON public.orders(store_id, status, created_at DESC);
