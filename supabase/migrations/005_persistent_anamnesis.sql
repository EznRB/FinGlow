-- ============================================================================
-- FinGlow Persistence Enhancement
-- Migration 005: Add anamnesis to profiles for "Save Info" feature
-- ============================================================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS anamnesis JSONB DEFAULT NULL;

COMMENT ON COLUMN public.profiles.anamnesis IS 'Stores the user financial profile/anamnesis for persistence.';
