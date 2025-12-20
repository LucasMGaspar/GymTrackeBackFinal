import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { createPreApproval, createOrGetCustomer } from '@/lib/mercadopago/client';

const CheckoutSchema = z.object({
  plan_slug: z.string().min(1),
});

/**
 * POST /api/billing/checkout
 * Create checkout session for subscription
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = rateLimit(
      request,
      RATE_LIMITS.write.maxRequests,
      RATE_LIMITS.write.windowMs
    );
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a personal trainer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'personal') {
      return NextResponse.json(
        { error: 'Only personal trainers can subscribe' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { plan_slug } = CheckoutSchema.parse(body);

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('slug', plan_slug)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Plan not found or inactive' },
        { status: 404 }
      );
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('personal_id', user.id)
      .in('status', ['trialing', 'active', 'past_due', 'pending'])
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'You already have an active subscription. Please cancel it first or switch plans.' },
        { status: 400 }
      );
    }

    // Get user email
    const { data: authUser } = await supabase.auth.getUser();
    const userEmail = authUser.user?.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Calculate dates
    const now = new Date();
    const startDate = plan.trial_days 
      ? new Date(now.getTime() + plan.trial_days * 24 * 60 * 60 * 1000)
      : now;

    // Create customer in Mercado Pago (if needed)
    const customerResult = await createOrGetCustomer({
      email: userEmail,
      first_name: profile.name?.split(' ')[0] || 'Personal',
      last_name: profile.name?.split(' ').slice(1).join(' ') || 'Trainer',
    });

    if (!customerResult.success) {
      console.error('[Checkout] Failed to create customer:', customerResult.error);
      // Continue anyway, MP will create customer during checkout
    }

    // Create preapproval in Mercado Pago
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const backUrl = `${appUrl}/app/personal/billing?status=success`;
    
    const preapprovalResult = await createPreApproval({
      reason: `Assinatura ${plan.name}`,
      auto_recurring: {
        frequency: plan.interval === 'year' ? 12 : 1,
        frequency_type: 'months',
        transaction_amount: plan.price_cents / 100, // Convert cents to currency
        currency_id: plan.currency as 'BRL' | 'USD' | 'EUR',
        start_date: startDate.toISOString(),
      },
      back_url: backUrl,
      status: 'pending',
      external_reference: `sub_${user.id}_${Date.now()}`,
      payer_email: userEmail,
    });

    if (!preapprovalResult.success) {
      console.error('[Checkout] Failed to create preapproval:', preapprovalResult.error);
      return NextResponse.json(
        { error: 'Failed to create checkout session', details: preapprovalResult.error },
        { status: 500 }
      );
    }

    // Create subscription record in database
    const subscriptionData = {
      personal_id: user.id,
      plan_id: plan.id,
      status: plan.trial_days ? 'trialing' : 'pending',
      mp_preapproval_id: preapprovalResult.data.id,
      mp_customer_id: customerResult.success ? customerResult.data.id : null,
      current_period_start: plan.trial_days ? now : null,
      current_period_end: plan.trial_days 
        ? new Date(now.getTime() + plan.trial_days * 24 * 60 * 60 * 1000)
        : null,
      trial_start: plan.trial_days ? now : null,
      trial_end: plan.trial_days 
        ? new Date(now.getTime() + plan.trial_days * 24 * 60 * 60 * 1000)
        : null,
    };

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (subError) {
      console.error('[Checkout] Failed to create subscription:', subError);
      // Try to cancel preapproval if subscription creation failed
      if (preapprovalResult.data.id) {
        await createPreApproval({} as any); // Will be handled by webhook cleanup
      }
      return NextResponse.json(
        { error: 'Failed to create subscription record' },
        { status: 500 }
      );
    }

    // Return checkout URL
    const checkoutUrl = process.env.NODE_ENV === 'production'
      ? preapprovalResult.data.init_point
      : preapprovalResult.data.sandbox_init_point || preapprovalResult.data.init_point;

    return NextResponse.json({
      success: true,
      checkout_url: checkoutUrl,
      subscription_id: subscription.id,
      preapproval_id: preapprovalResult.data.id,
    });
  } catch (error: any) {
    console.error('[Checkout] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create checkout' },
      { status: 500 }
    );
  }
}

