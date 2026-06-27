// FILE 2: /server/api/middleware/premium-check.ts
// ============================================================================
// Premium subscription verification middleware
// ============================================================================

import { H3Event } from 'h3';
import { serverSupabaseClient } from '#supabase/server';

export interface PremiumContext {
  isPremium: boolean;
  tier: 'FREE' | 'BASIC' | 'PREMIUM' | 'VIP';
  features: string[];
  expiresAt: Date | null;
}

export async function checkPremiumStatus(event: H3Event): Promise<PremiumContext> {
  try {
    const user = await requireAuth(event);
    if (!user?.id) {
      return {
        isPremium: false,
        tier: 'FREE',
        features: [],
        expiresAt: null
      };
    }

    const supabase = await serverSupabaseClient(event);
    
    // Get subscription data
    const { data: subscription, error } = await supabase
      .from('premium_subscriptions')
      .select('*, premium_features(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error || !subscription) {
      return {
        isPremium: false,
        tier: 'FREE',
        features: [],
        expiresAt: null
      };
    }

    // Check if subscription is still valid
    const expiresAt = new Date(subscription.expires_at);
    const isActive = expiresAt > new Date();

    if (!isActive) {
      return {
        isPremium: false,
        tier: 'FREE',
        features: [],
        expiresAt
      };
    }

    return {
      isPremium: true,
      tier: subscription.tier,
      features: subscription.premium_features?.map((f: any) => f.feature_name) || [],
      expiresAt
    };
  } catch (error) {
    console.error('Error checking premium status:', error);
    return {
      isPremium: false,
      tier: 'FREE',
      features: [],
      expiresAt: null
    };
  }
}

export async function requirePremium(event: H3Event): Promise<void> {
  const premium = await checkPremiumStatus(event);
  if (!premium.isPremium) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Premium subscription required'
    });
  }
}

export async function requirePremiumTier(event: H3Event, tier: string): Promise<void> {
  const premium = await checkPremiumStatus(event);
  const tiers = ['FREE', 'BASIC', 'PREMIUM', 'VIP'];
  const requiredIndex = tiers.indexOf(tier);
  const userIndex = tiers.indexOf(premium.tier);

  if (userIndex < requiredIndex) {
    throw createError({
      statusCode: 403,
      statusMessage: `${tier} subscription required`
    });
  }
}
