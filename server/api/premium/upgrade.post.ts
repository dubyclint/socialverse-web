// FILE 7: /server/api/premium/upgrade.post.ts
// ============================================================================
// POST /api/premium/upgrade - Upgrade to premium subscription
// ============================================================================

import { serverSupabaseClient } from '#supabase/server';
import { PremiumController } from '../../controllers/premium-controller';

interface UpgradeRequest {
  tier: 'BASIC' | 'PREMIUM' | 'VIP';
  paymentMethod: string;
  billingCycle?: 'monthly' | 'yearly';
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

    const body = await readBody<UpgradeRequest>(event);

    if (!body.tier || !body.paymentMethod) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: tier, paymentMethod'
      });
    }

    const supabase = await serverSupabaseClient(event);

    // Check if user already has active subscription
    const { data: existingSubscription } = await supabase
      .from('premium_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User already has an active subscription'
      });
    }

    // Create new subscription
    const billingCycle = body.billingCycle || 'monthly';
    const expiresAt = new Date();
    if (billingCycle === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    const { data: subscription, error } = await supabase
      .from('premium_subscriptions')
      .insert({
        user_id: user.id,
        tier: body.tier,
        status: 'active',
        payment_method: body.paymentMethod,
        billing_cycle: billingCycle,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log event
    await supabase
      .from('premium_events')
      .insert({
        user_id: user.id,
        event_type: 'upgrade',
        tier: body.tier,
        created_at: new Date().toISOString()
      });

    return {
      success: true,
      message: `Successfully upgraded to ${body.tier} tier`,
      data: {
        subscriptionId: subscription.id,
        tier: subscription.tier,
        expiresAt: subscription.expires_at,
        billingCycle: subscription.billing_cycle
      }
    };
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to upgrade subscription'
    });
  }
});
