// server/controllers/premium-controller.ts
// Fixed for Nitro (not Express) + Supabase

import { PremiumSubscription } from '../models/premiumSubscription';
import { PremiumFeature } from '../models/premiumFeature';
import { UserPremiumRestriction } from '../models/userPremiumRestriction';
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

      const [subscription, userTier, features, restrictions] = await Promise.all([
        PremiumSubscription.findByUserId(userId),
        PremiumSubscription.getUserTier(userId),
        PremiumFeature.getUserFeatures(userId),
        UserPremiumRestriction.getUserRestrictions(userId)
      ]);

      return {
        success: true,
        data: {
          subscription: subscription || null,
          currentTier: userTier,
          features: features,
          restrictions: restrictions,
          isActive: await PremiumSubscription.isActive(userId)
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

      const result = await PremiumSubscription.upgrade(userId, tier, paymentMethod);

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

      const { reason } = body;
      const result = await PremiumSubscription.cancel(userId, reason);

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

      const features = await PremiumFeature.getUserFeatures(userId);

      return {
        success: true,
        data: features
      };
    } catch (error) {
      console.error('Error getting user features:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Error retrieving user features'
      });
    }
  }
}
