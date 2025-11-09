// models/userPremiumRestriction.js - User Premium Restrictions Model
import { supabase } from '../utils/supabase.js';

export class UserPremiumRestriction {
  
  /**
   * Create a new restriction
   */
  static async create(restrictionData) {
    try {
      const { data, error } = await supabase
        .from('user_premium_restrictions')
        .insert({
          user_id: restrictionData.userId,
          restriction_type: restrictionData.restrictionType,
          restriction_value: restrictionData.restrictionValue || {},
          applied_by: restrictionData.appliedBy,
          reason: restrictionData.reason,
          expires_at: restrictionData.expiresAt,
          is_active: restrictionData.isActive !== false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating premium restriction:', error);
      throw error;
    }
  }

  /**
   * Get user restrictions
   */
  static async getUserRestrictions(userId, activeOnly = true) {
    try {
      let query = supabase
        .from('user_premium_restrictions')
        .select(`
          *,
          applied_by_profile:applied_by(username, email)
        `)
        .eq('user_id', userId);

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      query = query.order('applied_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Filter out expired restrictions
      const now = new Date();
      return (data || []).filter(restriction => {
        if (!restriction.expires_at) return true;
        return new Date(restriction.expires_at) > now;
      });
    } catch (error) {
      console.error('Error getting user restrictions:', error);
      return [];
    }
  }

  /**
   * Check if user has specific restriction
   */
  static async hasRestriction(userId, restrictionType) {
    try {
      const restrictions = await this.getUserRestrictions(userId);
      return restrictions.some(r => r.restriction_type === restrictionType);
    } catch (error) {
      console.error('Error checking restriction:', error);
      return false;
    }
  }

  /**
   * Get restriction value
   */
  static async getRestrictionValue(userId, restrictionType) {
    try {
      const restrictions = await this.getUserRestrictions(userId);
      const restriction = restrictions.find(r => r.restriction_type === restrictionType);
      return restriction ? restriction.restriction_value : null;
    } catch (error) {
      console.error('Error getting restriction value:', error);
      return null;
    }
  }

  /**
   * Apply restriction to user
   */
  static async applyRestriction(userId, restrictionType, restrictionValue, appliedBy, reason, expiresAt = null) {
    try {
      // Check if restriction already exists
      const existing = await this.hasRestriction(userId, restrictionType);
      
      if (existing) {
        throw new Error(`User already has ${restrictionType} restriction`);
      }

      return await this.create({
        userId,
        restrictionType,
        restrictionValue,
        appliedBy,
        reason,
        expiresAt
      });
    } catch (error) {
      console.error('Error applying restriction:', error);
      throw error;
    }
  }

  /**
   * Remove restriction
   */
  static async removeRestriction(userId, restrictionType, removedBy, reason = 'Restriction removed') {
    try {
      const { data, error } = await supabase
        .from('user_premium_restrictions')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('restriction_type', restrictionType)
        .eq('is_active', true)
        .select();

      if (error) throw error;

      // Log the removal
      await this.logRestrictionEvent(userId, restrictionType, 'REMOVED', {
        removed_by: removedBy,
        reason
      });

      return data;
    } catch (error) {
      console.error('Error removing restriction:', error);
      throw error;
    }
  }

  /**
   * Update restriction
   */
  static async updateRestriction(restrictionId, updateData) {
    try {
      const { data, error } = await supabase
        .from('user_premium_restrictions')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', restrictionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating restriction:', error);
      throw error;
    }
  }

  /**
   * Get all restrictions with filters
   */
  static async findAll(filters = {}) {
    try {
      let query = supabase
        .from('user_premium_restrictions')
        .select(`
          *,
          user_profile:user_id(username, email),
          applied_by_profile:applied_by(username, email)
        `);

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.restrictionType) {
        query = query.eq('restriction_type', filters.restrictionType);
      }

      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      query = query.order('applied_at', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error finding restrictions:', error);
      return [];
    }
  }

  /**
   * Clean up expired restrictions
   */
  static async cleanupExpired() {
    try {
      const { data, error } = await supabase
        .from('user_premium_restrictions')
        .update({ is_active: false })
        .lt('expires_at', new Date().toISOString())
        .eq('is_active', true)
        .select();

      if (error) throw error;

      return {
        cleaned: data?.length || 0,
        restrictions: data || []
      };
    } catch (error) {
      console.error('Error cleaning up expired restrictions:', error);
      throw error;
    }
  }

  /**
   * Common restriction types
   */
  static getRestrictionTypes() {
    return {
      FEATURE_LIMIT: 'feature_limit',
      DAILY_LIMIT: 'daily_limit',
      MONTHLY_LIMIT: 'monthly_limit',
      ACCESS_DENIED: 'access_denied',
      RATE_LIMIT: 'rate_limit',
      CONTENT_RESTRICTION: 'content_restriction',
      INTERACTION_LIMIT: 'interaction_limit'
    };
  }

  /**
   * Apply common restrictions based on tier
   */
  static async applyTierRestrictions(userId, tier, appliedBy = null) {
    try {
      const restrictions = [];

      switch (tier) {
        case 'FREE':
          restrictions.push(
            { type: 'DAILY_LIMIT', value: { pewgifts: 5, posts: 10, messages: 50 } },
            { type: 'FEATURE_LIMIT', value: { advanced_chat: false, profile_analytics: false } }
          );
          break;
        
        case 'BASIC':
          restrictions.push(
            { type: 'DAILY_LIMIT', value: { pewgifts: 25, posts: 50, messages: 200 } },
            { type: 'FEATURE_LIMIT', value: { profile_analytics: false, api_access: false } }
          );
          break;
        
        case 'PREMIUM':
          restrictions.push(
            { type: 'DAILY_LIMIT', value: { pewgifts: 100, posts: 200, messages: 1000 } },
            { type: 'FEATURE_LIMIT', value: { api_access: false, white_label: false } }
          );
          break;
        
        case 'VIP':
          // No restrictions for VIP users
          break;
      }

      const results = [];
      for (const restriction of restrictions) {
        try {
          const created = await this.create({
            userId,
            restrictionType: restriction.type,
            restrictionValue: restriction.value,
            appliedBy,
            reason: `Tier-based restriction for ${tier} subscription`
          });
          results.push(created);
        } catch (error) {
          console.error(`Error applying ${restriction.type} restriction:`, error);
        }
      }

      return results;
    } catch (error) {
      console.error('Error applying tier restrictions:', error);
      throw error;
    }
  }

  /**
   * Helper: Log restriction events
   */
  static async logRestrictionEvent(userId, restrictionType, eventType, eventData) {
    try {
      await supabase
        .from('restriction_events')
        .insert({
          user_id: userId,
          restriction_type: restrictionType,
          event_type: eventType,
          event_data: eventData,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging restriction event:', error);
    }
  }
}
