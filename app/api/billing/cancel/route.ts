import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { cancelPreApproval } from '@/lib/mercadopago/client';

const CancelSchema = z.object({
  immediate: z.boolean().optional().default(false),
});

/**
 * POST /api/billing/cancel
 * Cancel subscription (at period end or immediately)
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
    const { immediate } = CancelSchema.parse(body);

    // Get active subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('personal_id', user.id)
      .in('status', ['trialing', 'active', 'past_due'])
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Cancel in Mercado Pago
    if (subscription.mp_preapproval_id) {
      const cancelResult = await cancelPreApproval(subscription.mp_preapproval_id);
      
      if (!cancelResult.success) {
        console.error('[Cancel] Failed to cancel in MP:', cancelResult.error);
        // Continue with database update anyway
      }
    }

    // Update subscription in database
    const updateData: any = {
      cancel_at_period_end: !immediate,
      canceled_at: immediate ? new Date().toISOString() : null,
      status: immediate ? 'canceled' : subscription.status,
    };

    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscription.id)
      .select()
      .single();

    if (updateError) {
      console.error('[Cancel] Failed to update subscription:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      message: immediate 
        ? 'Subscription canceled immediately' 
        : 'Subscription will be canceled at the end of the current period',
    });
  } catch (error: any) {
    console.error('[Cancel] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

