-- ============================================================================
-- Rollback: rollback_db_write_lockdown
-- Description: Script d'annulation complète de la migration migration_db_write_lockdown.sql
-- Rejouable: OUI (idempotent)
-- ============================================================================

-- 1. TRIGGERS DE LIMITES
DROP TRIGGER IF EXISTS trg_check_product_limit ON public.products;
DROP FUNCTION IF EXISTS public.check_product_limit();

DROP TRIGGER IF EXISTS trg_check_store_limit ON public.stores;
DROP FUNCTION IF EXISTS public.check_store_limit();

-- 2. AI_GENERATION_LOGS
DROP POLICY IF EXISTS "owner read" ON public.ai_generation_logs;
DROP POLICY IF EXISTS "ai_generation_logs_owner_read" ON public.ai_generation_logs;

CREATE POLICY "owner read" ON public.ai_generation_logs
  FOR SELECT
  TO authenticated
  USING (
    store_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = ai_generation_logs.store_id
        AND s.owner_id = auth.uid()
    )
  );

-- 3. ORDERS
REVOKE UPDATE (
  status,
  notes,
  call_attempts,
  cancel_reason,
  confirmed_by,
  confirmed_at,
  payment_status,
  agent_notes
) ON public.orders FROM authenticated;

GRANT INSERT, UPDATE ON public.orders TO anon, authenticated;

DROP POLICY IF EXISTS "orders public insert" ON public.orders;
CREATE POLICY "orders public insert" ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 4. STORES
GRANT INSERT, UPDATE, DELETE ON public.stores TO authenticated;

-- 5. PRODUCTS
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;

-- 6. PROFILES
REVOKE INSERT (id, full_name, phone) ON public.profiles FROM authenticated;
REVOKE UPDATE (full_name, phone) ON public.profiles FROM authenticated;

GRANT INSERT, UPDATE ON public.profiles TO authenticated;
