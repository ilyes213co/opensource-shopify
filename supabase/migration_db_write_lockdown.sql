-- ============================================================================
-- Migration: db_write_lockdown
-- Description: Verrouillage strict des droits d'écriture client sur la base de données
--              et mise en place de garde-fous de sécurité au niveau PostgreSQL.
-- Auteur: Équipe EasyTrade
-- Rejouable: OUI (idempotent)
-- ============================================================================

-- ATTENTION / NOTE D'ARCHITECTURE :
-- Les limites de plan (stores et products) existent désormais à DEUX ENDROITS :
-- 1. Côté applicatif (TypeScript: platform/lib/plan-limits-server.ts & Python: api/plan_guard.py)
--    pour valider en amont et retourner immédiatement des codes HTTP 403 avec messages utilisateur clairs.
-- 2. Côté base de données (Triggers PostgreSQL trg_check_store_limit et trg_check_product_limit ci-dessous)
--    comme verrou ultime inviolable garantissant le respect strict des quotas même si le code applicatif était contourné.

-- ============================================================================
-- 1. PROFILES : VERROUILLAGE DES ÉCRITURES PAR COLONNES
-- ============================================================================
-- En PostgreSQL, un REVOKE sur une colonne spécifique échoue silencieusement
-- ou est inopérant si le rôle dispose du privilège au niveau de la table entière.
-- On révoque donc d'abord au niveau table, puis on n'accorde que les colonnes
-- légitimes que le navigateur a le droit d'écrire.
REVOKE INSERT, UPDATE ON public.profiles FROM anon, authenticated;

-- Le client authenticated ne peut insérer que id, full_name et phone
GRANT INSERT (id, full_name, phone) ON public.profiles TO authenticated;

-- Le client authenticated ne peut mettre à jour que full_name et phone
-- (les colonnes plan et plan_expires_at ne peuvent être écrites que par la clé de service service_role)
GRANT UPDATE (full_name, phone) ON public.profiles TO authenticated;

-- ============================================================================
-- 2. PRODUCTS : VERROUILLAGE COMPLET DES ÉCRITURES CLIENT
-- ============================================================================
-- Toutes les opérations de création, modification et suppression de produits
-- passent exclusivement par le serveur (/api/products) muni de la clé admin service_role
-- après vérification d'authentification et d'appartenance à la boutique.
REVOKE INSERT, UPDATE, DELETE ON public.products FROM anon, authenticated;

-- ============================================================================
-- 3. STORES : VERROUILLAGE COMPLET DES ÉCRITURES CLIENT
-- ============================================================================
-- Toutes les créations (wizard et onboarding), mises à jour (paramètres, logos)
-- et suppressions passent désormais exclusivement par les routes serveur
-- (/api/stores et /api/stores/[id]) avec le client admin service_role.
REVOKE INSERT, UPDATE, DELETE ON public.stores FROM anon, authenticated;

-- ============================================================================
-- 4. ORDERS : SUPPRESSION INSERT DIRECT ET RESTRICTION UPDATE PAR COLONNES
-- ============================================================================
-- Les commandes sont obligatoirement créées côté serveur (/api/orders) pour recalculer
-- les montants (total_amount) et valider les articles/tarifs de livraison.
DROP POLICY IF EXISTS "orders public insert" ON public.orders;
REVOKE INSERT ON public.orders FROM anon, authenticated;

-- Révocation de l'UPDATE global sur orders pour bloquer la falsification de total_amount,
-- store_id, items, etc. par une session utilisateur authentifiée.
REVOKE UPDATE ON public.orders FROM anon, authenticated;

-- Seules les colonnes opérationnelles nécessaires au tableau de bord / téléopérateurs
-- sont autorisées en mise à jour pour le rôle authenticated.
GRANT UPDATE (
  status,
  notes,
  call_attempts,
  cancel_reason,
  confirmed_by,
  confirmed_at,
  payment_status,
  agent_notes
) ON public.orders TO authenticated;

-- ============================================================================
-- 5. AI_GENERATION_LOGS : RESTRICTION LECTURE AUX PROPRIÉTAIRES DE LA BOUTIQUE
-- ============================================================================
-- Remplacement de la politique permissive "owner read" :
-- - Réservée au rôle authenticated (anon ne peut rien lire)
-- - Supprime la branche "store_id IS NULL" qui permettait la fuite des logs orphelins
-- - Vérifie strictement que l'utilisateur est propriétaire de la boutique liée via EXISTS sur stores
DROP POLICY IF EXISTS "owner read" ON public.ai_generation_logs;
DROP POLICY IF EXISTS "ai_generation_logs_owner_read" ON public.ai_generation_logs;

CREATE POLICY "owner read" ON public.ai_generation_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = ai_generation_logs.store_id
        AND s.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. TRIGGERS DE LIMITES DE PLAN (STORES & PRODUCTS)
-- ============================================================================
-- RÈGLES ALIGNÉES SUR plan-limits-server.ts ET plan_guard.py :
-- 1. Si plan_expires_at est dépassé (< now()), le plan effectif est rétrogradé à 'free'.
-- 2. Stores :
--    - 'business' : illimité
--    - 'pro'      : 5 boutiques max
--    - 'free'     : 1 boutique max
-- 3. Products :
--    - 'business' / 'pro' : illimité
--    - 'free'             : 10 produits max par boutique (tous statuts confondus)

-- Fonction de contrôle du quota de boutiques
CREATE OR REPLACE FUNCTION public.check_store_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text := 'free';
  v_expires_at timestamptz := NULL;
  v_limit int := 1;
  v_count int := 0;
BEGIN
  -- Récupération du plan du propriétaire
  SELECT coalesce(lower(trim(plan)), 'free'), plan_expires_at
  INTO v_plan, v_expires_at
  FROM public.profiles
  WHERE id = NEW.owner_id;

  -- Rétrogradation automatique si le plan est expiré
  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    v_plan := 'free';
  END IF;

  -- Détermination de la limite selon le plan effectif
  IF v_plan = 'business' THEN
    RETURN NEW; -- Illimité
  ELSIF v_plan = 'pro' THEN
    v_limit := 5;
  ELSE
    v_limit := 1;
  END IF;

  -- Comptage des boutiques existantes du propriétaire
  SELECT count(*) INTO v_count
  FROM public.stores
  WHERE owner_id = NEW.owner_id;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED: stores'
      USING ERRCODE = 'P0001',
            MESSAGE = 'PLAN_LIMIT_REACHED: stores';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_store_limit ON public.stores;
CREATE TRIGGER trg_check_store_limit
  BEFORE INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.check_store_limit();


-- Fonction de contrôle du quota de produits
CREATE OR REPLACE FUNCTION public.check_product_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_plan text := 'free';
  v_expires_at timestamptz := NULL;
  v_limit int := 10;
  v_count int := 0;
BEGIN
  -- Identification du propriétaire de la boutique
  SELECT owner_id INTO v_owner_id
  FROM public.stores
  WHERE id = NEW.store_id;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'STORE_NOT_FOUND'
      USING ERRCODE = 'P0002',
            MESSAGE = 'STORE_NOT_FOUND';
  END IF;

  -- Récupération du plan du propriétaire
  SELECT coalesce(lower(trim(plan)), 'free'), plan_expires_at
  INTO v_plan, v_expires_at
  FROM public.profiles
  WHERE id = v_owner_id;

  -- Rétrogradation automatique si le plan est expiré
  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    v_plan := 'free';
  END IF;

  -- Détermination de la limite de produits (pro et business = illimité)
  IF v_plan IN ('pro', 'business') THEN
    RETURN NEW; -- Illimité
  ELSE
    v_limit := 10;
  END IF;

  -- Comptage des produits existants de la boutique (tous statuts)
  SELECT count(*) INTO v_count
  FROM public.products
  WHERE store_id = NEW.store_id;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED: products'
      USING ERRCODE = 'P0001',
            MESSAGE = 'PLAN_LIMIT_REACHED: products';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_product_limit ON public.products;
CREATE TRIGGER trg_check_product_limit
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.check_product_limit();
