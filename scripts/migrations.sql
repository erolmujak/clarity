-- ============================================
-- Migration 1: Add preferred_language column
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en';

-- ============================================
-- Migration 2: Create balances table
-- ============================================
CREATE TABLE IF NOT EXISTS public.balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric(16, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BAM',
  rate_to_bam numeric(16, 6) NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "balances_select_own" ON public.balances;
DROP POLICY IF EXISTS "balances_insert_own" ON public.balances;
DROP POLICY IF EXISTS "balances_update_own" ON public.balances;
DROP POLICY IF EXISTS "balances_delete_own" ON public.balances;

CREATE POLICY "balances_select_own" ON public.balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "balances_insert_own" ON public.balances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "balances_update_own" ON public.balances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "balances_delete_own" ON public.balances FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_balances_user_id ON public.balances(user_id);
