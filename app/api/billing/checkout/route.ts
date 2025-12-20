import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { createPreApproval, createOrGetCustomer } from '@/lib/mercadopago/client';

// Force dynamic rendering to avoid build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    // Check if MP_ACCESS_TOKEN is configured
    if (!process.env.MP_ACCESS_TOKEN) {
      console.error('[Checkout] MP_ACCESS_TOKEN not configured');
      return NextResponse.json(
        { error: 'Payment service not configured. Please contact support.' },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('[Checkout] Error getting user:', userError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

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

    if (planError) {
      console.error('[Checkout] Error fetching plan:', planError);
      return NextResponse.json(
        { error: 'Plan not found or inactive', details: planError.message },
        { status: 404 }
      );
    }

    if (!plan) {
      console.error('[Checkout] Plan not found for slug:', plan_slug);
      return NextResponse.json(
        { error: 'Plan not found. Please make sure the seed was executed.' },
        { status: 404 }
      );
    }

    // Check if user already has an active subscription
    const { data: existingSubscription, error: existingSubError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('personal_id', user.id)
      .in('status', ['trialing', 'active', 'past_due', 'pending'])
      .maybeSingle();

    if (existingSubError) {
      console.error('[Checkout] Error checking existing subscription:', existingSubError);
      // Continue anyway, might be a table issue
    }

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
    
    console.log('[Checkout] Creating preapproval with params:', {
      reason: `Assinatura ${plan.name}`,
      amount: plan.price_cents / 100,
      currency: plan.currency,
      interval: plan.interval,
      backUrl,
    });
    
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

    if (!preapprovalResult.success || !preapprovalResult.data) {
      console.error('[Checkout] Failed to create preapproval:', {
        error: preapprovalResult.error,
        details: preapprovalResult.details,
      });
      return NextResponse.json(
        { 
          error: 'Failed to create checkout session', 
          details: preapprovalResult.error || 'Unknown error',
          message: 'Please check if MP_ACCESS_TOKEN is valid and Mercado Pago API is accessible'
        },
        { status: 500 }
      );
    }

    console.log('[Checkout] Preapproval created successfully:', preapprovalResult.data.id);

    // Create subscription record in database
    const subscriptionData = {
      personal_id: user.id,
      plan_id: plan.id,
      status: plan.trial_days ? 'trialing' : 'pending',
      mp_preapproval_id: preapprovalResult.data.id,
      mp_customer_id: customerResult.success && customerResult.data ? customerResult.data.id : null,
      current_period_start: plan.trial_days ? now : null,
      current_period_end: plan.trial_days 
        ? new Date(now.getTime() + plan.trial_days * 24 * 60 * 60 * 1000)
        : null,
      trial_start: plan.trial_days ? now : null,
      trial_end: plan.trial_days 
        ? new Date(now.getTime() + plan.trial_days * 24 * 60 * 60 * 1000)
        : null,
    };

    console.log('[Checkout] Creating subscription record:', subscriptionData);
    
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (subError) {
      console.error('[Checkout] Failed to create subscription:', {
        error: subError,
        code: subError.code,
        message: subError.message,
        details: subError.details,
        hint: subError.hint,
      });
      // Preapproval will be cleaned up by webhook or manual cancellation
      if (preapprovalResult.data?.id) {
        console.warn('[Checkout] Subscription creation failed, preapproval may need manual cleanup:', preapprovalResult.data.id);
      }
      return NextResponse.json(
        { 
          error: 'Failed to create subscription record',
          details: subError.message,
          hint: subError.hint || 'Check if the subscriptions table exists and RLS policies are correct'
        },
        { status: 500 }
      );
    }

    console.log('[Checkout] Subscription created successfully:', subscription.id);

    // Return checkout URL
    const checkoutUrl = process.env.NODE_ENV === 'production'
      ? preapprovalResult.data.init_point
      : preapprovalResult.data.sandbox_init_point || preapprovalResult.data.init_point || '';

    if (!checkoutUrl) {
      console.error('[Checkout] No checkout URL available');
      return NextResponse.json(
        { error: 'Failed to generate checkout URL' },
        { status: 500 }
      );
    }

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

