-- =====================================================
-- BILLING SYSTEM - Plans and Subscriptions
-- Migration: 006_billing_system.sql
-- =====================================================

-- 1. Plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL' CHECK (currency IN ('BRL', 'USD', 'EUR')),
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  trial_days INTEGER DEFAULT NULL CHECK (trial_days >= 0),
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.plans IS 'Subscription plans available in the system';
COMMENT ON COLUMN public.plans.features IS 'JSON object with plan limits (e.g., {"max_students": 50, "max_exercises": 200})';

-- 2. Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'incomplete' CHECK (status IN (
    'trialing',
    'active',
    'past_due',
    'canceled',
    'paused',
    'unpaid',
    'incomplete',
    'pending'
  )),
  mp_preapproval_id TEXT UNIQUE,
  mp_subscription_id TEXT UNIQUE,
  mp_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Only one active subscription per personal
  CONSTRAINT unique_active_subscription UNIQUE NULLS NOT DISTINCT (personal_id, status) 
    WHERE status IN ('trialing', 'active', 'past_due', 'pending')
);

COMMENT ON TABLE public.subscriptions IS 'Active and historical subscriptions for personal trainers';
COMMENT ON COLUMN public.subscriptions.mp_preapproval_id IS 'Mercado Pago preapproval ID (for recurring payments)';
COMMENT ON COLUMN public.subscriptions.mp_subscription_id IS 'Mercado Pago subscription ID (if using subscription API)';
COMMENT ON COLUMN public.subscriptions.mp_customer_id IS 'Mercado Pago customer ID';

-- 3. Subscription events table (event store for webhooks)
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'mercadopago' CHECK (provider IN ('mercadopago', 'stripe', 'other')),
  event_id TEXT NOT NULL,
  dedupe_key TEXT GENERATED ALWAYS AS (provider || '_' || event_id) STORED UNIQUE,
  event_type TEXT NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.subscription_events IS 'Event store for webhook events from payment providers';
COMMENT ON COLUMN public.subscription_events.dedupe_key IS 'Generated unique key for idempotency (provider_event_id)';
COMMENT ON COLUMN public.subscription_events.processed_at IS 'Timestamp when event was successfully processed';

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_personal_id ON public.subscriptions(personal_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_mp_preapproval_id ON public.subscriptions(mp_preapproval_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_mp_subscription_id ON public.subscriptions(mp_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON public.subscriptions(current_period_end) 
  WHERE status IN ('active', 'trialing', 'past_due');

CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_id ON public.subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type ON public.subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_processed_at ON public.subscription_events(processed_at);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON public.subscription_events(created_at);

-- 5. RLS Policies

-- Plans: Everyone can read active plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON public.plans FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Service role can manage plans"
  ON public.plans FOR ALL
  USING (auth.role() = 'service_role');

-- Subscriptions: Personal trainers can view their own subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Personal trainers can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (personal_id = auth.uid());

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Subscription events: Service role only (webhook processing)
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage subscription events"
  ON public.subscription_events FOR ALL
  USING (auth.role() = 'service_role');

-- 6. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Function to get current active subscription
CREATE OR REPLACE FUNCTION get_active_subscription(p_personal_id UUID)
RETURNS TABLE (
  id UUID,
  plan_id UUID,
  plan_slug TEXT,
  plan_name TEXT,
  status TEXT,
  current_period_end TIMESTAMPTZ,
  features JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.plan_id,
    p.slug as plan_slug,
    p.name as plan_name,
    s.status,
    s.current_period_end,
    p.features
  FROM public.subscriptions s
  INNER JOIN public.plans p ON p.id = s.plan_id
  WHERE s.personal_id = p_personal_id
    AND s.status IN ('trialing', 'active', 'past_due')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_active_subscription IS 'Returns the current active subscription for a personal trainer';

