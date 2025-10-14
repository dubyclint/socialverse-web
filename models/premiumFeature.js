// models/premiumFeature.js - Premium Features Management Model
import { supabase } from '../utils/supabase.js';

export class PremiumFeature {
  
  /**
   * Create a new premium feature
   */
  static async create(featureData) {
    try {
      const { data, error } = await supabase
        .from('premium_features')
        .insert({
          feature_name: featureData.featureName,
          feature_key: featureData.featureKey,
          description: featureData.description,
          required_tier: featureData.requiredTier,
          is_active: featureData.isActive !== false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating premium feature:', error);
      throw error;
    }
  }

  /**
   * Get all premium features
   */
  static async findAll(filters = {}) {
    try {
      let query = supabase
        .from('premium_features')
        .select('*');

      if (filters.requiredTier) {
        query = query.eq('required_tier', filters.requiredTier);
      }

      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      query = query.order('required_tier').order('feature_name');

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error finding premium features:', error);
      throw error;
    }
  }

  /**
   * Find feature by key
   */
  static async findByKey(featureKey) {
    try {
      const { data, error } = await supabase
        .from('premium_features')
        .select('*')
        .eq('feature_key', featureKey)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error finding feature by key:', error);
      throw error;
    }
  }

  /**
   * Update premium feature
   */
  static async update(featureId, updateData) {
    try {
      const { data, error } = await supabase
        .from('premium_features')
        .update(updateData)
        .eq('id', featureId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating premium feature:', error);
      throw error;
    }
  }

  /**
   * Check if user has access to feature
   */
  static async hasAccess(userId, featureKey) {
    try {
      // Get feature requirements
      const feature = await this.findByKey(featureKey);
      if (!feature) return false;

      // Get user's subscription tier
      const { PremiumSubscription } = await import('./premiumSubscription.js');
      const userTier = await PremiumSubscription.getUserTier(userId);

      // Check tier hierarchy
      return this.checkTierAccess(userTier, feature.required_tier);
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Get features available to user
   */
  static async getUserFeatures(userId) {
    try {
      const { PremiumSubscription } = await import('./premiumSubscription.js');
      const userTier = await PremiumSubscription.getUserTier(userId);
      
      const allFeatures = await this.findAll({ isActive: true });
      
      return allFeatures.filter(feature => 
        this.checkTierAccess(userTier, feature.required_tier)
      );
    } catch (error) {
      console.error('Error getting user features:', error);
      return [];
    }
  }

  /**
   * Get features by tier
   */
  static async getFeaturesByTier(tier) {
    try {
      const features = await this.findAll({ 
        requiredTier: tier, 
        isActive: true 
      });
      
      return features;
    } catch (error) {
      console.error('Error getting features by tier:', error);
      return [];
    }
  }

  /**
   * Helper: Check tier access hierarchy
   */
  static checkTierAccess(userTier, requiredTier) {
    const tierHierarchy = {
      'FREE': 0,
      'BASIC': 1,
      'PREMIUM': 2,
      'VIP': 3
    };

    const userLevel = tierHierarchy[userTier] || 0;
    const requiredLevel = tierHierarchy[requiredTier] || 0;

    return userLevel >= requiredLevel;
  }

  /**
   * Bulk create default features
   */
  static async createDefaultFeatures() {
    const defaultFeatures = [
      {
        featureName: 'Advanced Chat Features',
        featureKey: 'advanced_chat',
        description: 'Enhanced chat with typing indicators and custom backgrounds',
        requiredTier: 'BASIC'
      },
      {
        featureName: 'Unlimited PewGifts',
        featureKey: 'unlimited_pewgifts',
        description: 'Send unlimited PewGifts without daily limits',
        requiredTier: 'BASIC'
      },
      {
        featureName: 'Profile Analytics',
        featureKey: 'profile_analytics',
        description: 'See who viewed your profile and detailed analytics',
        requiredTier: 'PREMIUM'
      },
      {
        featureName: 'Priority Support',
        featureKey: 'priority_support',
        description: '24/7 priority customer support',
        requiredTier: 'PREMIUM'
      },
      {
        featureName: 'Custom Profile Themes',
        featureKey: 'custom_themes',
        description: 'Customize your profile with premium themes',
        requiredTier: 'PREMIUM'
      },
      {
        featureName: 'Advanced Security Features',
        featureKey: 'advanced_security',
        description: 'Enhanced security options and monitoring',
        requiredTier: 'VIP'
      },
      {
        featureName: 'API Access',
        featureKey: 'api_access',
        description: 'Access to developer API endpoints',
        requiredTier: 'VIP'
      },
      {
        featureName: 'White Label Features',
        featureKey: 'white_label',
        description: 'Remove branding and customize interface',
        requiredTier: 'VIP'
      }
    ];

    const results = [];
    for (const feature of defaultFeatures) {
      try {
        const existing = await this.findByKey(feature.featureKey);
        if (!existing) {
          const created = await this.create(feature);
          results.push(created);
        }
      } catch (error) {
        console.error(`Error creating feature ${feature.featureKey}:`, error);
      }
    }

    return results;
  }
}
