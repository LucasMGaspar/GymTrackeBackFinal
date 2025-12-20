-- =====================================================
-- UPDATE PRO MONTHLY PLAN - Set price to R$ 1,00 for testing
-- Migration: 009_add_test_plan.sql
-- =====================================================

-- Update Pro Monthly Plan price to R$ 1,00 (100 cents) for testing
UPDATE public.plans
SET 
  price_cents = 100,
  updated_at = NOW()
WHERE slug = 'pro-monthly';

-- Verify plan was updated
SELECT slug, name, price_cents, interval, is_active 
FROM public.plans 
WHERE slug = 'pro-monthly';

