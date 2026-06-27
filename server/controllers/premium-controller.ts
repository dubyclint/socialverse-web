// server/controllers/premium-controller.ts
// Fixed for Nitro (not Express) + Supabase

import { PremiumModel } from '../models/premium';
import type { H3Event } from 'h3';

interface SubscriptionUpgradeRequest {
  tier: 'BASIC' | 'PREMIUM' | 'VIP';
  paymentMethod: string;
}

interface CancelSubscriptionRequest {
  reason?: string;
}

interface PricingTier {
  price: number;
  currency: string;
  period: string;
  features: any[];
}

interface PricingResponse {
  [key: string]: PricingTier;
}

export class PremiumController {
  /**
   * Get user's subscription status
   * GET /api/premium/status
   */
  static async getSubscriptionStatus(event: H3Event): Promise<any> {
    try {
      const user = await requireAuth(event);
      const userId = user.id;

      if (!userId) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Authentication required'
        });
      }

      const subscription = await PremiumModel.getSubscriptionByUserId(userId);

      return {
        success: true,
        data: {
          subscription: subscription || null,
          isActive: subscription?.status === 'ACTIVE'
        }
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Error retrieving subscription status'
      });
    }
  }

  /**
   * Upgrade subscription
   * POST /api/premium/upgrade
   */
  static async upgradeSubscription(event: H3Event): Promise<any> {
    try {
      const user = await requireAuth(event);
      const userId = user.id;
      const body = await readBody<SubscriptionUpgradeRequest>(event);

      if (!userId) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Authentication required'
        });
      }

      const { tier, paymentMethod } = body;

      if (!tier || !paymentMethod) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Missing required fields: tier, paymentMethod'
        });
      }

      const result = await PremiumModel.createSubscription({
        userId,
        subscriptionType: tier,
        status: 'ACTIVE',
        startedAt: new Date().toISOString(),
        autoRenew: true,
        paymentMethod,
        monthlyFee: this.getTierPrice(tier),
        features: this.getTierFeatures(tier)
      });

      return {
        success: true,
        message: `Successfully upgraded to ${tier} tier`,
        data: result
      };
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Error upgrading subscription'
      });
    }
  }

  /**
   * Cancel subscription
   * POST /api/premium/cancel
   */
  static async cancelSubscription(event: H3Event): Promise<any> {
    try {
      const user = await requireAuth(event);
      const userId = user.id;
      const body = await readBody<CancelSubscriptionRequest>(event);

      if (!userId) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Authentication required'
        });
      }

      const subscription = await PremiumModel.getSubscriptionByUserId(userId);
      if (!subscription) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Subscription not found'
        });
      }

      const result = await PremiumModel.cancelSubscription(subscription.id);

      return {
        success: true,
        message: 'Subscription cancelled successfully',
        data: result
      };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Error cancelling subscription'
      });
    }
  }

  /**
   * Get pricing information
   * GET /api/premium/pricing
   */
  static async getPricing(event: H3Event): Promise<PricingResponse> {
    try {
      const pricing: PricingResponse = {
        BASIC: {
          price: 9.99,
          currency: 'USD',
          period: 'month',
          features: ['Feature 1', 'Feature 2']
        },
        PREMIUM: {
          price: 19.99,
          currency: 'USD',
          period: 'month',
          features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4']
        },
        VIP: {
          price: 49.99,
          currency: 'USD',
          period: 'month',
          features: ['All features', 'Priority support', 'Custom features']
        }
      };

      return pricing;
    } catch (error) {
      console.error('Error getting pricing:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Error retrieving pricing information'
      });
    }
  }

  /**
   * Get user features
   * GET /api/premium/features
   */
  static async getUserFeatures(event: H3Event): Promise<any> {
    try {
      const user = await requireAuth(event);
      const userId = user.id;

      if (!userId) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Authentication required'
        });
      }

      const subscription = await PremiumModel.getSubscriptionByUserId(userId);

      return {
        success: true,
        data: {
          features: subscription?.features || {},
          tier: subscription?.subscriptionType || 'FREE'
        }
      };
    } catch (error) {
      console.error('Error getting user features:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Error retrieving user features'
      });
    }
  }

  // Helper methods
  private static getTierPrice(tier: string): number {
    const prices: Record<string, number> = {
      'BASIC': 9.99,
      'PREMIUM': 19.99,
      'VIP': 49.99
    };
    return prices[tier] || 0;
  }

  private static getTierFeatures(tier: string): Record<string, any> {
    const features: Record<string, Record<string, any>> = {
      'BASIC': { p2p: true, matching: false },
      'PREMIUM': { p2p: true, matching: true, rankHide: false },
      'VIP': { p2p: true, matching: true, rankHide: true }
    };
    return features[tier] || {};
  }
}
