// server/controllers/ premium-controller.js- Premium Subscription Management Controller
import { PremiumSubscription } from '../models/premiumSubscription.js';
import { PremiumFeature } from '../models/premiumFeature.js';
import { UserPremiumRestriction } from '../models/userPremiumRestriction.js';

export class PremiumController {
  
  /**
   * Get user's subscription status
   * GET /api/premium/status
   */
  static async getSubscriptionStatus(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
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
  static async upgradeSubscription(req, res) {
    try {
      const userId = req.user?.id;
      const { tier, paymentMethod } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!tier || !['BASIC', 'PREMIUM', 'VIP'].includes(tier)) {
        return res.status(400).json({
          success: false,
          message: 'Valid subscription tier is required'
        });
      }

      // Check current tier
      const currentTier = await PremiumSubscription.getUserTier(userId);
      const tierHierarchy = { 'FREE': 0, 'BASIC': 1, 'PREMIUM': 2, 'VIP': 3 };
      
      if (tierHierarchy[tier] <= tierHierarchy[currentTier]) {
        return res.status(400).json({
          success: false,
          message: 'Cannot upgrade to a lower or same tier'
        });
      }

      // Process upgrade
      const updatedSubscription = await PremiumSubscription.upgrade(userId, tier, paymentMethod);

      // Remove old tier restrictions and apply new ones
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
  static async cancelSubscription(req, res) {
    try {
      const userId = req.user?.id;
      const { reason } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const cancelledSubscription = await PremiumSubscription.cancel(userId, reason);

      // Apply FREE tier restrictions
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
  static async getFeatures(req, res) {
    try {
      const { tier } = req.params;
      const userId = req.user?.id;

      let features;
      if (tier) {
        features = await PremiumFeature.getFeaturesByTier(tier);
      } else if (userId) {
        features = await PremiumFeature.getUserFeatures(userId);
      } else {
        features = await PremiumFeature.findAll({ isActive: true });
      }

      // Group features by tier
      const featuresByTier = features.reduce((acc, feature) => {
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
  static async checkFeatureAccess(req, res) {
    try {
      const userId = req.user?.id;
      const { featureKey } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
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
  static async getPricing(req, res) {
    try {
      const pricing = {
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

  /**
   * Admin: Get all subscriptions
   * GET /api/premium/admin/subscriptions
   */
  static async getAllSubscriptions(req, res) {
    try {
      const userId = req.user?.id;
      const { status, tier, limit } = req.query;

      // Check admin permissions
      const isAdmin = await this.checkAdminPermission(userId);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin permissions required'
        });
      }

      const filters = {};
      if (status) filters.status = status;
      if (tier) filters.subscriptionType = tier;
      if (limit) filters.limit = parseInt(limit);

      const subscriptions = await PremiumSubscription.findAll(filters);
      const statistics = await PremiumSubscription.getStatistics();

      res.json({
        success: true,
        data: {
          subscriptions: subscriptions,
          statistics: statistics
        }
      });
    } catch (error) {
      console.error('Error getting all subscriptions:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving subscriptions'
      });
    }
  }

  /**
   * Admin: Process subscription renewals
   * POST /api/premium/admin/process-renewals
   */
  static async processRenewals(req, res) {
    try {
      const userId = req.user?.id;

      // Check admin permissions
      const isAdmin = await this.checkAdminPermission(userId);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin permissions required'
        });
      }

      const results = await PremiumSubscription.processRenewals();

      res.json({
        success: true,
        message: 'Renewal processing completed',
        data: results
      });
    } catch (error) {
      console.error('Error processing renewals:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing renewals'
      });
    }
  }

  /**
   * Helper: Check admin permissions
   * @private
   */
  static async checkAdminPermission(userId) {
    try {
      const { supabase } = await import('../utils/supabase.js');
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      return profile && ['admin', 'manager'].includes(profile.role);
    } catch (error) {
      console.error('Error checking admin permission:', error);
      return false;
    }
  }
}
