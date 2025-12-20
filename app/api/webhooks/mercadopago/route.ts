import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { getPreApproval, mapMPStatusToInternal } from '@/lib/mercadopago/client';
import crypto from 'crypto';

/**
 * Verify webhook signature from Mercado Pago
 * Note: MP doesn't always send signatures, so we'll validate via API call
 */
function verifyWebhookSignature(request: NextRequest, payload: string): boolean {
  // Mercado Pago doesn't always send webhook signatures
  // We'll validate by fetching the resource from MP API
  // For now, we'll accept all webhooks but log them
  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');
  
  // Log for debugging
  console.log('[Webhook] Headers:', {
    xSignature,
    xRequestId,
    userAgent: request.headers.get('user-agent'),
  });

  // In production, you should validate the webhook by:
  // 1. Checking x-signature header if available
  // 2. Fetching the resource from MP API to verify it exists
  // 3. Checking IP ranges (MP webhook IPs)
  
  return true; // For now, accept all (will validate via API)
}

/**
 * Generate idempotency key from event data
 */
function generateIdempotencyKey(eventId: string, provider: string = 'mercadopago'): string {
  return `${provider}_${eventId}`;
}

// Force dynamic rendering to avoid build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/webhooks/mercadopago
 * Handle Mercado Pago webhook events
 */
export async function POST(request: NextRequest) {
  let eventId: string = '';
  let eventType: string = 'unknown';
  
  try {
    // Rate limiting (more restrictive for webhooks)
    const rateLimitResponse = rateLimit(
      request,
      RATE_LIMITS.write.maxRequests / 2, // Half the normal limit
      RATE_LIMITS.write.windowMs
    );
    if (rateLimitResponse) {
      console.warn('[Webhook] Rate limit exceeded');
      return rateLimitResponse;
    }

    const payload = await request.text();
    const body = JSON.parse(payload);

    // Extract event information - ensure eventId is always a string
    eventId = body.id || body.data?.id || `evt_${Date.now()}_${Math.random()}`;
    eventType = body.type || body.action || 'unknown';

    // Ensure eventId is not empty and is a string
    if (!eventId || typeof eventId !== 'string') {
      eventId = `evt_${Date.now()}_${Math.random()}`;
    }

    console.log('[Webhook] Received event:', {
      eventId,
      eventType,
      resource: body.data?.id || body.resource,
      timestamp: new Date().toISOString(),
    });

    // Verify webhook (basic check)
    if (!verifyWebhookSignature(request, payload)) {
      console.warn('[Webhook] Signature verification failed:', eventId);
      // Continue anyway, but log warning
    }

    // Create Supabase client with service role for webhook processing
    const supabase = await createClient();

    // Generate idempotency key (eventId is guaranteed to be string here)
    const dedupeKey = generateIdempotencyKey(eventId);

    // Check if event was already processed (idempotency)
    const { data: existingEvent } = await supabase
      .from('subscription_events')
      .select('id, processed_at, processing_error')
      .eq('dedupe_key', dedupeKey)
      .single();

    if (existingEvent) {
      console.log('[Webhook] Event already processed:', {
        eventId,
        dedupeKey,
        processedAt: existingEvent.processed_at,
      });

      // Return 200 to acknowledge receipt (idempotent)
      return NextResponse.json({
        success: true,
        message: 'Event already processed',
        eventId,
      });
    }

    // Store event in event store (before processing)
    const { data: storedEvent, error: storeError } = await supabase
      .from('subscription_events')
      .insert({
        provider: 'mercadopago',
        event_id: eventId,
        event_type: eventType,
        payload: body,
      })
      .select()
      .single();

    if (storeError) {
      console.error('[Webhook] Failed to store event:', storeError);
      // Continue processing anyway
    }

    // Process event based on type
    let subscriptionId: string | null = null;
    let processingError: string | null = null;

    try {
      // Extract preapproval/subscription ID from webhook
      const mpPreapprovalId = body.data?.id || body.resource;
      
      if (!mpPreapprovalId) {
        throw new Error('No preapproval ID found in webhook payload');
      }

      // Fetch subscription from database
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('mp_preapproval_id', mpPreapprovalId)
        .single();

      if (subError || !subscription) {
        console.warn('[Webhook] Subscription not found for preapproval:', mpPreapprovalId);
        // Store event but don't fail
        subscriptionId = null;
      } else {
        subscriptionId = subscription.id;

        // Fetch latest status from Mercado Pago API
        const mpStatusResult = await getPreApproval(mpPreapprovalId);
        
        if (mpStatusResult.success && mpStatusResult.data && mpStatusResult.data.status) {
          const mpStatus = mpStatusResult.data.status;
          const internalStatus = mapMPStatusToInternal(mpStatus);

          // Update subscription based on event type
          const updateData: any = {
            status: internalStatus,
            updated_at: new Date().toISOString(),
          };

          // Handle specific event types
          if (eventType === 'authorized' || mpStatus === 'authorized') {
            updateData.status = 'active';
            
            // Set period dates if not set
            if (!subscription.current_period_start) {
              updateData.current_period_start = new Date().toISOString();
            }
            
            if (!subscription.current_period_end) {
              const periodEnd = new Date();
              const plan = await supabase
                .from('plans')
                .select('interval')
                .eq('id', subscription.plan_id)
                .single();
              
              if (plan.data) {
                if (plan.data.interval === 'year') {
                  periodEnd.setFullYear(periodEnd.getFullYear() + 1);
                } else {
                  periodEnd.setMonth(periodEnd.getMonth() + 1);
                }
                updateData.current_period_end = periodEnd.toISOString();
              }
            }
          } else if (eventType === 'cancelled' || mpStatus === 'cancelled') {
            updateData.status = 'canceled';
            updateData.canceled_at = new Date().toISOString();
            updateData.cancel_at_period_end = false;
          } else if (eventType === 'paused' || mpStatus === 'paused') {
            updateData.status = 'paused';
          } else if (eventType === 'pending' || mpStatus === 'pending') {
            updateData.status = 'pending';
          }

          // Update subscription
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update(updateData)
            .eq('id', subscription.id);

          if (updateError) {
            throw new Error(`Failed to update subscription: ${updateError.message}`);
          }

          console.log('[Webhook] Subscription updated:', {
            subscriptionId: subscription.id,
            oldStatus: subscription.status,
            newStatus: updateData.status,
            eventType,
          });
        } else {
          console.warn('[Webhook] Failed to fetch MP status:', mpStatusResult.error);
        }
      }
    } catch (error: any) {
      processingError = error.message || 'Unknown error';
      console.error('[Webhook] Processing error:', {
        eventId,
        error: processingError,
        stack: error.stack,
      });
    }

    // Update event with processing result
    if (storedEvent) {
      await supabase
        .from('subscription_events')
        .update({
          subscription_id: subscriptionId,
          processed_at: processingError ? null : new Date().toISOString(),
          processing_error: processingError,
        })
        .eq('id', storedEvent.id);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({
      success: true,
      eventId,
      eventType,
      processed: !processingError,
      error: processingError || undefined,
    });
  } catch (error: any) {
    console.error('[Webhook] Fatal error:', {
      eventId,
      eventType,
      error: error.message,
      stack: error.stack,
    });

    // Store error event if possible
    if (eventId) {
      try {
        const supabase = await createClient();
        await supabase
          .from('subscription_events')
          .insert({
            provider: 'mercadopago',
            event_id: eventId,
            event_type: eventType || 'unknown',
            payload: { error: 'Failed to parse payload' },
            processing_error: error.message,
          });
      } catch (storeError) {
        console.error('[Webhook] Failed to store error event:', storeError);
      }
    }

    // Return 200 anyway to prevent MP from retrying
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      eventId: eventId || 'unknown',
    });
  }
}

