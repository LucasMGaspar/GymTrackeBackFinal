-- =====================================================
-- SEED PLANS - Default Plans
-- Migration: 007_seed_plans.sql
-- =====================================================

-- Free Plan
INSERT INTO public.plans (slug, name, description, price_cents, currency, interval, trial_days, features, is_active)
VALUES (
  'free',
  'Plano Gratuito',
  'Ideal para começar. Gerencie até 5 alunos e tenha acesso às funcionalidades básicas.',
  0,
  'BRL',
  'month',
  NULL,
  '{
    "max_students": 5,
    "max_exercises": 50,
    "max_templates_per_student": 7,
    "whatsapp_notifications": false,
    "reports": false,
    "api_access": false
  }'::jsonb,
  TRUE
) ON CONFLICT (slug) DO NOTHING;

-- Pro Monthly Plan
INSERT INTO public.plans (slug, name, description, price_cents, currency, interval, trial_days, features, is_active)
VALUES (
  'pro-monthly',
  'Pro Mensal',
  'Plano profissional mensal. Gerencie até 50 alunos com todas as funcionalidades.',
  9900,
  'BRL',
  'month',
  7,
  '{
    "max_students": 50,
    "max_exercises": 500,
    "max_templates_per_student": 7,
    "whatsapp_notifications": true,
    "reports": true,
    "api_access": false,
    "priority_support": true
  }'::jsonb,
  TRUE
) ON CONFLICT (slug) DO NOTHING;

-- Pro Yearly Plan (2 months free)
INSERT INTO public.plans (slug, name, description, price_cents, currency, interval, trial_days, features, is_active)
VALUES (
  'pro-yearly',
  'Pro Anual',
  'Plano profissional anual com desconto. Economize 2 meses pagando anualmente.',
  99000,
  'BRL',
  'year',
  7,
  '{
    "max_students": 50,
    "max_exercises": 500,
    "max_templates_per_student": 7,
    "whatsapp_notifications": true,
    "reports": true,
    "api_access": false,
    "priority_support": true
  }'::jsonb,
  TRUE
) ON CONFLICT (slug) DO NOTHING;

-- Business Monthly Plan
INSERT INTO public.plans (slug, name, description, price_cents, currency, interval, trial_days, features, is_active)
VALUES (
  'business-monthly',
  'Business Mensal',
  'Para academias e grandes personal trainers. Sem limites e com todas as funcionalidades.',
  19900,
  'BRL',
  'month',
  14,
  '{
    "max_students": -1,
    "max_exercises": -1,
    "max_templates_per_student": -1,
    "whatsapp_notifications": true,
    "reports": true,
    "api_access": true,
    "priority_support": true,
    "white_label": true,
    "custom_branding": true
  }'::jsonb,
  TRUE
) ON CONFLICT (slug) DO NOTHING;

-- Business Yearly Plan
INSERT INTO public.plans (slug, name, description, price_cents, currency, interval, trial_days, features, is_active)
VALUES (
  'business-yearly',
  'Business Anual',
  'Plano business anual com desconto. Ideal para academias que querem economizar.',
  199000,
  'BRL',
  'year',
  14,
  '{
    "max_students": -1,
    "max_exercises": -1,
    "max_templates_per_student": -1,
    "whatsapp_notifications": true,
    "reports": true,
    "api_access": true,
    "priority_support": true,
    "white_label": true,
    "custom_branding": true
  }'::jsonb,
  TRUE
) ON CONFLICT (slug) DO NOTHING;

-- Verify plans were created
SELECT slug, name, price_cents, interval, is_active FROM public.plans ORDER BY price_cents;

