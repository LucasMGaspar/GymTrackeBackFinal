-- =====================================================
-- FIX SUBSCRIPTIONS RLS - Add INSERT and UPDATE policies
-- Migration: 008_fix_subscriptions_rls.sql
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Personal trainers can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Personal trainers can insert their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Personal trainers can update their own subscriptions" ON public.subscriptions;

-- Recreate SELECT policy
CREATE POLICY "Personal trainers can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (personal_id = auth.uid());

-- Add INSERT policy (this was missing!)
CREATE POLICY "Personal trainers can insert their own subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (personal_id = auth.uid());

-- Add UPDATE policy (for plan changes, cancellations, etc.)
CREATE POLICY "Personal trainers can update their own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (personal_id = auth.uid())
  WITH CHECK (personal_id = auth.uid());

-- Service role policy remains unchanged (for webhooks)
-- This allows the service role to manage all subscriptions

COMMENT ON POLICY "Personal trainers can insert their own subscriptions" ON public.subscriptions IS 
  'Allows personal trainers to create their own subscription records during checkout';

COMMENT ON POLICY "Personal trainers can update their own subscriptions" ON public.subscriptions IS 
  'Allows personal trainers to update their own subscriptions (e.g., cancel, change plan)';


