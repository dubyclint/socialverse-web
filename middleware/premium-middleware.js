// middleware/premium-middleware.js - Premium Feature Access Middleware
import { PremiumFeature } from '../server/models/premium-feature.js';
import { UserPremiumRestriction } from '../server/models/user-premium-restriction.js';
import { PremiumSubscription } from '../server/models/premium-subscription.js';

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
        
        return res.status(403).json({
          success: false,
          message: 'Premium feature access denied',
          code: 'PREMIUM_ACCESS_DENIED',
          requiredTier: feature?.requiredTier,
          currentTier: userTier
        });
      }

      next();
    } catch (error) {
      console.error('Premium middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

/**
 * Middleware to check user premium restrictions
 */
export const checkPremiumRestrictions = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return next();
    }

    const restrictions = await UserPremiumRestriction.findByUserId(userId);
    
    if (restrictions && restrictions.isRestricted) {
      return res.status(403).json({
        success: false,
        message: 'User account has premium restrictions',
        code: 'PREMIUM_RESTRICTION_ACTIVE',
        restrictions: restrictions
      });
    }

    next();
  } catch (error) {
    console.error('Premium restriction check error:', error);
    next();
  }
};

/**
 * Middleware to verify premium subscription status
 */
export const verifyPremiumSubscription = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const subscription = await PremiumSubscription.findByUserId(userId);
    
    if (!subscription || !subscription.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Active premium subscription required',
        code: 'NO_ACTIVE_SUBSCRIPTION'
      });
    }

    // Attach subscription info to request
    req.premiumSubscription = subscription;
    next();
  } catch (error) {
    console.error('Premium subscription verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};
