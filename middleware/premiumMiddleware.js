// middleware/premiumMiddleware.js - Premium Feature Access Middleware
import { PremiumFeature } from '../models/premiumFeature.js';
import { UserPremiumRestriction } from '../models/userPremiumRestriction.js';
import { PremiumSubscription } from '../models/premiumSubscription.js';

/**
 * Middleware to check if user has access to premium feature
 */
export const requirePremiumFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Check if user has access to the feature
      const hasAccess = await PremiumFeature.hasAccess(userId, featureKey);
      
      if (!hasAccess) {
        const feature = await PremiumFeature.findByKey(featureKey);
        const userTier = await PremiumSubscription.getUserTier(userId);
        
        return res.status(403).json({*_
          success: false,
          message: `This feature requires ${feature?.required_tier || 'premium'} subscription`,
          code: 'PREMIUM_REQUIRED',
          data: {
            feature: feature?.feature_name,
            requiredTier: feature?.required_tier,
            currentTier: userTier,
            upgradeUrl: '/premium/upgrade'
          }
        });
      }

      // Check for specific restrictions
      const hasRestriction = await UserPremiumRestriction.hasRestriction(userId, 'ACCESS_DENIED');
      if (hasRestriction) {
        return res.status(403).json({
          success: false,
          message: 'Access to premium features is restricted',
          code: 'ACCESS_RESTRICTED'
        });
      }

      next();
    } catch (error) {
      console.error('Error in premium feature middleware:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking premium access',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

/**
 * Middleware to check subscription tier
 */
export const requireSubscriptionTier = (requiredTier) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const userTier = await PremiumSubscription.getUserTier(userId);
      const hasAccess = PremiumFeature.checkTierAccess(userTier, requiredTier);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: `This endpoint requires ${requiredTier} subscription or higher`,
          code: 'TIER_REQUIRED',
          data: {
            requiredTier,
            currentTier: userTier,
            upgradeUrl: '/premium/upgrade'
          }
        });
      }

      req.userTier = userTier;
      next();
    } catch (error) {
      console.error('Error in subscription tier middleware:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking subscription tier',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

/**
 * Middleware to check daily limits
 */
export const checkDailyLimit = (limitType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Get user's daily limit restrictions
      const limitRestriction = await UserPremiumRestriction.getRestrictionValue(userId, 'DAILY_LIMIT');
      
      if (limitRestriction && limitRestriction[limitType] !== undefined) {
        const dailyLimit = limitRestriction[limitType];
        
        // Check current usage (you'll need to implement usage tracking)
        const currentUsage = await getCurrentDailyUsage(userId, limitType);
        
        if (currentUsage >= dailyLimit) {
          return res.status(429).json({
            success: false,
            message: `Daily limit reached for ${limitType}`,
            code: 'DAILY_LIMIT_EXCEEDED',
            data: {
              limit: dailyLimit,
              used: currentUsage,
              resetTime: getNextResetTime()
            }
          });
        }

        // Add usage info to request
        req.dailyUsage = {
          limit: dailyLimit,
          used: currentUsage,
          remaining: dailyLimit - currentUsage
        };
      }

      next();
    } catch (error) {
      console.error('Error in daily limit middleware:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking daily limits'
      });
    }
  };
};

/**
 * Middleware to add premium context to request
 */
export const addPremiumContext = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (userId) {
      const [userTier, userFeatures, userRestrictions] = await Promise.all([
        PremiumSubscription.getUserTier(userId),
        PremiumFeature.getUserFeatures(userId),
        UserPremiumRestriction.getUserRestrictions(userId)
      ]);

      req.premium = {
        tier: userTier,
        features: userFeatures,
        restrictions: userRestrictions,
        hasFeature: (featureKey) => userFeatures.some(f => f.feature_key === featureKey),
        hasRestriction: (restrictionType) => userRestrictions.some(r => r.restriction_type === restrictionType)
      };
    }

    next();
  } catch (error) {
    console.error('Error adding premium context:', error);
    next(); // Continue without premium context
  }
};

// Helper functions
async function getCurrentDailyUsage(userId, limitType) {
  // This should be implemented based on your usage tracking system
  // For now, returning 0 as placeholder
  return 0;
}

function getNextResetTime() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}
