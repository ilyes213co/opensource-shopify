-- ==============================================================================
-- Migration: Renforcement et Unicité Insensible à la Casse des Slugs de Boutiques
-- ==============================================================================

-- 1. Index d'unicité insensible à la casse sur stores.slug
-- Empêche qu'une boutique 'Adidas' et une boutique 'adidas' puissent coexister.
CREATE UNIQUE INDEX IF NOT EXISTS stores_slug_lower_uniq
  ON public.stores (lower(slug));

-- 2. Contrainte de validation du format et de la longueur (2 à 40 caractères)
-- Accepte les slugs historiques courts (dx, qa) tout en verrouillant le format DNS-compatible.
-- Le minimum de 3 caractères pour les nouveaux slugs est appliqué côté applicatif.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_stores_slug_format'
  ) THEN
    ALTER TABLE public.stores
      ADD CONSTRAINT chk_stores_slug_format
      CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) BETWEEN 2 AND 40);
  END IF;
END $$;

-- 3. Rechargement du cache de schéma PostgREST
NOTIFY pgrst, 'reload schema';
