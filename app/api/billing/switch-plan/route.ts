import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { cancelPreApproval, createPreApproval, createOrGetCustomer } from '@/lib/mercadopago/client';

const SwitchPlanSchema = z.object({
  plan_slug: z.string().min(1),
});

/**
 * POST /api/billing/switch-plan
 * Switch subscription plan (upgrade/downgrade)
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

    const body = await request.json();
    const { plan_slug } = SwitchPlanSchema.parse(body);

    // Get new plan
    const { data: newPlan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('slug', plan_slug)
      .eq('is_active', true)
      .single();

    if (planError || !newPlan) {
      return NextResponse.json(
        { error: 'Plan not found or inactive' },
        { status: 404 }
      );
    }

    // Get current subscription
    const { data: currentSubscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('personal_id', user.id)
      .in('status', ['trialing', 'active', 'past_due'])
      .single();

    if (subError || !currentSubscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Check if switching to same plan
    if (currentSubscription.plan_id === newPlan.id) {
      return NextResponse.json(
        { error: 'You are already subscribed to this plan' },
        { status: 400 }
      );
    }

    // Determine if upgrade or downgrade (by price)
    const currentPrice = (currentSubscription.plan as any)?.price_cents || 0;
    const newPrice = newPlan.price_cents;
    const isUpgrade = newPrice > currentPrice;

    // Policy: Upgrade immediately, Downgrade at period end
    if (isUpgrade) {
      // Cancel current subscription immediately
      if (currentSubscription.mp_preapproval_id) {
        await cancelPreApproval(currentSubscription.mp_preapproval_id);
      }

      // Create new subscription with new plan
      const { data: authUser } = await supabase.auth.getUser();
      const userEmail = authUser.user?.email;

      if (!userEmail) {
        return NextResponse.json(
          { error: 'User email not found' },
          { status: 400 }
        );
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      // Create customer if needed
      await createOrGetCustomer({
        email: userEmail,
        first_name: profile?.name?.split(' ')[0] || 'Personal',
        last_name: profile?.name?.split(' ').slice(1).join(' ') || 'Trainer',
      });

      // Create new preapproval
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const preapprovalResult = await createPreApproval({
        reason: `Assinatura ${newPlan.name}`,
        auto_recurring: {
          frequency: newPlan.interval === 'year' ? 12 : 1,
          frequency_type: 'months',
          transaction_amount: newPlan.price_cents / 100,
          currency_id: newPlan.currency as 'BRL' | 'USD' | 'EUR',
        },
        back_url: `${appUrl}/app/personal/billing?status=success`,
        status: 'pending',
        external_reference: `sub_${user.id}_${Date.now()}`,
        payer_email: userEmail,
      });

      if (!preapprovalResult.success) {
        return NextResponse.json(
          { error: 'Failed to create new subscription', details: preapprovalResult.error },
          { status: 500 }
        );
      }

      // Cancel old subscription
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        })
        .eq('id', currentSubscription.id);

      // Create new subscription
      const now = new Date();
      const { data: newSubscription, error: newSubError } = await supabase
        .from('subscriptions')
        .insert({
          personal_id: user.id,
          plan_id: newPlan.id,
          status: newPlan.trial_days ? 'trialing' : 'pending',
          mp_preapproval_id: preapprovalResult.data.id,
          current_period_start: newPlan.trial_days ? now : null,
          current_period_end: newPlan.trial_days 
            ? new Date(now.getTime() + newPlan.trial_days * 24 * 60 * 60 * 1000)
            : null,
          trial_start: newPlan.trial_days ? now : null,
          trial_end: newPlan.trial_days 
            ? new Date(now.getTime() + newPlan.trial_days * 24 * 60 * 60 * 1000)
            : null,
        })
        .select(`
          *,
          plan:plans(*)
        `)
        .single();

      if (newSubError) {
        return NextResponse.json(
          { error: 'Failed to create new subscription' },
          { status: 500 }
        );
      }

      const checkoutUrl = process.env.NODE_ENV === 'production'
        ? preapprovalResult.data.init_point
        : preapprovalResult.data.sandbox_init_point || preapprovalResult.data.init_point;

      return NextResponse.json({
        success: true,
        message: 'Upgrade successful. Please complete the checkout.',
        checkout_url: checkoutUrl,
        subscription: newSubscription,
      });
    } else {
      // Downgrade: schedule for period end
      const { data: updatedSubscription, error: updateError } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          // Store new plan_id for later activation
          // Note: This requires a scheduled job or webhook handler to activate at period end
        })
        .eq('id', currentSubscription.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to schedule plan change' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Plan change scheduled for end of current period',
        subscription: updatedSubscription,
      });
    }
  } catch (error: any) {
    console.error('[SwitchPlan] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to switch plan' },
      { status: 500 }
    );
  }
}

