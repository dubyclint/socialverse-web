import { Request, Response } from 'express';
import { PremiumSubscription } from '../models/premiumSubscription';
import { PremiumFeature } from '../models/premiumFeature';
import { UserPremiumRestriction } from '../models/userPremiumRestriction';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

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
  static async getSubscriptionStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const [subscription, userTier, features, restrictions] = await Promise.all([
        PremiumSubscription.findByUserId(userId),
        PremiumSubscription.getUserTier(userId),
        PremiumFeature.getUserFeatures(userId),
        UserPremiumRestriction.getUserRestrictions(userId)
      ]);

      res.json({
        success: true,
        data: {
          subscription: subscription || null,
          currentTier: userTier,
          features: features,
          restrictions: restrictions,
          isActive: await PremiumSubscription.isActive(userId)
        }
      });
    } catch (error) {
      console.error('Error getting subscription status:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving subscription status'
      });
    }
  }

  /**
   * Upgrade subscription
   * POST /api/premium/upgrade
   */
  static async upgradeSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { tier, paymentMethod } = req.body as SubscriptionUpgradeRequest;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (!tier || !['BASIC', 'PREMIUM', 'VIP'].includes(tier)) {
        res.status(400).json({
          success: false,
          message: 'Valid subscription tier is required'
        });
        return;
      }

      const currentTier = await PremiumSubscription.getUserTier(userId);
      const tierHierarchy: { [key: string]: number } = {
        'FREE': 0,
        'BASIC': 1,
        'PREMIUM': 2,
        'VIP': 3
      };

      if (tierHierarchy[tier] <= tierHierarchy[currentTier]) {
        res.status(400).json({
          success: false,
          message: 'Cannot upgrade to a lower or same tier'
        });
        return;
      }

      const updatedSubscription = await PremiumSubscription.upgrade(userId, tier, paymentMethod);

      await UserPremiumRestriction.removeRestriction(userId, 'DAILY_LIMIT', userId, 'Tier upgrade');
      await UserPremiumRestriction.removeRestriction(userId, 'FEATURE_LIMIT', userId, 'Tier upgrade');
      await UserPremiumRestriction.applyTierRestrictions(userId, tier, userId);

      res.json({
        success: true,
        message: `Successfully upgraded to ${tier}`,
        data: {
          subscription: updatedSubscription,
          newTier: tier,
          features: await PremiumFeature.getUserFeatures(userId)
        }
      });
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing subscription upgrade'
      });
    }
  }

  /**
   * Cancel subscription
   * POST /api/premium/cancel
   */
  static async cancelSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { reason } = req.body as CancelSubscriptionRequest;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const cancelledSubscription = await PremiumSubscription.cancel(userId, reason);

      await UserPremiumRestriction.applyTierRestrictions(userId, 'FREE', userId);

      res.json({
        success: true,
        message: 'Subscription cancelled successfully',
        data: {
          subscription: cancelledSubscription,
          newTier: 'FREE'
        }
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Error cancelling subscription'
      });
    }
  }

  /**
   * Get available features by tier
   * GET /api/premium/features/:tier?
   */
  static async getFeatures(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { tier } = req.params;
      const userId = req.user?.id;

      let features: any[];
      if (tier) {
        features = await PremiumFeature.getFeaturesByTier(tier);
      } else if (userId) {
        features = await PremiumFeature.getUserFeatures(userId);
      } else {
        features = await PremiumFeature.findAll({ isActive: true });
      }

      const featuresByTier: { [key: string]: any[] } = features.reduce((acc, feature) => {
        if (!acc[feature.required_tier]) {
          acc[feature.required_tier] = [];
        }
        acc[feature.required_tier].push(feature);
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          features: features,
          featuresByTier: featuresByTier,
          userTier: userId ? await PremiumSubscription.getUserTier(userId) : 'FREE'
        }
      });
    } catch (error) {
      console.error('Error getting features:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving features'
      });
    }
  }

  /**
   * Check feature access
   * GET /api/premium/check/:featureKey
   */
  static async checkFeatureAccess(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { featureKey } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const hasAccess = await PremiumFeature.hasAccess(userId, featureKey);
      const feature = await PremiumFeature.findByKey(featureKey);
      const userTier = await PremiumSubscription.getUserTier(userId);

      res.json({
        success: true,
        data: {
          hasAccess: hasAccess,
          feature: feature,
          userTier: userTier,
          requiredTier: feature?.required_tier
        }
      });
    } catch (error) {
      console.error('Error checking feature access:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking feature access'
      });
    }
  }

  /**
   * Get subscription pricing
   * GET /api/premium/pricing
   */
  static async getPricing(req: Request, res: Response): Promise<void> {
    try {
      const pricing: PricingResponse = {
        FREE: {
          price: 0,
          currency: 'USD',
          period: 'forever',
          features: await PremiumFeature.getFeaturesByTier('FREE')
        },
        BASIC: {
          price: 9.99,
          currency: 'USD',
          period: 'month',
          features: await PremiumFeature.getFeaturesByTier('BASIC')
        },
        PREMIUM: {
          price: 19.99,
          currency: 'USD',
          period: 'month',
          features: await PremiumFeature.getFeaturesByTier('PREMIUM')
        },
        VIP: {
          price: 49.99,
          currency: 'USD',
          period: 'month',
          features: await PremiumFeature.getFeaturesByTier('VIP')
        }
      };

      res.json({
        success: true,
        data: pricing
      });
    } catch (error) {
      console.error('Error getting pricing:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving pricing information'
      });
    }
  }
}
