// FILE 8: /server/api/premium/cancel.post.ts
// ============================================================================
// POST /api/premium/cancel - Cancel premium subscription
// ============================================================================

import { serverSupabaseClient } from '#supabase/server';

interface CancelRequest {
  reason?: string;
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    
    if (!user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    const body = await readBody<CancelRequest>(event);
    const supabase = await serverSupabaseClient(event);

    // Get active subscription
    const { data: subscription, error: fetchError } = await supabase
      .from('premium_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (fetchError || !subscription) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No active subscription found'
      });
    }

    // Cancel subscription
    const { error: updateError } = await supabase
      .from('premium_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: body.reason || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      throw updateError;
    }

    // Log event
    await supabase
      .from('premium_events')
      .insert({
        user_id: user.id,
        event_type: 'cancel',
        tier: subscription.tier,
        reason: body.reason || null,
        created_at: new Date().toISOString()
      });

    return {
      success: true,
      message: 'Subscription cancelled successfully',
      data: {
        subscriptionId: subscription.id,
        cancelledAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to cancel subscription'
    });
  }
});
