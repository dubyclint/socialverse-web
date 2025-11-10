// server/models/security-restriction.js - Security Restrictions Management Model
import { supabase } from '../utils/supabase.js';

export class SecurityRestriction {
  
  /**
   * Create a new security restriction
   */
  static async create(restrictionData) {
    try {
      const { data, error } = await supabase
        .from('security_restrictions')
        .insert({
          user_id: restrictionData.userId,
          restriction_type: restrictionData.restrictionType,
          restriction_data: restrictionData.restrictionData || {},
          applied_by: restrictionData.appliedBy,
          reason: restrictionData.reason,
          expires_at: restrictionData.expiresAt,
          is_active: restrictionData.isActive !== false
        })
        .select()
        .single();

      if (error) throw error;

      // Log restriction application
      await this.logRestrictionEvent(restrictionData.userId, 'RESTRICTION_APPLIED', {
        restriction_type: restrictionData.restrictionType,
        applied_by: restrictionData.appliedBy,
        reason: restrictionData.reason
      });

      return data;
    } catch (error) {
      console.error('Error creating security restriction:', error);
      throw error;
    }
  }

  /**
   * Get user restrictions
   */
  static async getUserRestrictions(userId, activeOnly = true) {
    try {
      let query = supabase
        .from('security_restrictions')
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
   * Check if user has restriction
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
   * Apply IP ban
   */
  static async banIP(ipAddress, reason, appliedBy, expiresAt = null) {
    try {
      return await this.create({
        userId: null, // IP bans are not user-specific
        restrictionType: 'IP_BAN',
        restrictionData: { ip_address: ipAddress },
        appliedBy,
        reason,
        expiresAt
      });
    } catch (error) {
      console.error('Error banning IP:', error);
      throw error;
    }
  }

  /**
   * Check if IP is banned
   */
  static async isIPBanned(ipAddress) {
    try {
      const { data, error } = await supabase
        .from('security_restrictions')
        .select('*')
        .eq('restriction_type', 'IP_BAN')
        .eq('is_active', true)
        .contains('restriction_data', { ip_address: ipAddress });

      if (error) throw error;

      // Check if any non-expired bans exist
      const now = new Date();
      const activeBans = (data || []).filter(ban => {
        if (!ban.expires_at) return true;
        return new Date(ban.expires_at) > now;
      });

      return activeBans.length > 0;
    } catch (error) {
      console.error('Error checking IP ban:', error);
      return false;
    }
  }

  /**
   * Apply account suspension
   */
  static async suspendAccount(userId, reason, appliedBy, expiresAt = null) {
    try {
      // Terminate all active sessions
      const { UserSession } = await import('./userSession.js');
      await UserSession.forceDisconnect(userId, 'Account suspended', appliedBy);

      return await this.create({
        userId,
        restrictionType: 'ACCOUNT_SUSPENSION',
        restrictionData: { suspended_at: new Date().toISOString() },
        appliedBy,
        reason,
        expiresAt
      });
    } catch (error) {
      console.error('Error suspending account:', error);
      throw error;
    }
  }

  /**
   * Check if account is suspended
   */
  static async isAccountSuspended(userId) {
    try {
      return await this.hasRestriction(userId, 'ACCOUNT_SUSPENSION');
    } catch (error) {
      console.error('Error checking account suspension:', error);
      return false;
    }
  }

  /**
   * Remove restriction
   */
  static async removeRestriction(restrictionId, removedBy, reason = 'Restriction lifted') {
    try {
      const { data, error } = await supabase
        .from('security_restrictions')
        .update({
          is_active: false,
          removed_at: new Date().toISOString(),
          removed_by: removedBy,
          removal_reason: reason
        })
        .eq('id', restrictionId)
        .select()
        .single();

      if (error) throw error;

      // Log restriction removal
      await this.logRestrictionEvent(data.user_id, 'RESTRICTION_REMOVED', {
        restriction_type: data.restriction_type,
        removed_by: removedBy,
        reason: reason
      });

      return data;
    } catch (error) {
      console.error('Error removing restriction:', error);
      throw error;
    }
  }

  /**
   * Get all restrictions (admin)
   */
  static async getAllRestrictions(filters = {}) {
    try {
      let query = supabase
        .from('security_restrictions')
        .select(`
          *,
          user_profile:user_id(username, email),
          applied_by_profile:applied_by(username, email)
        `);

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
      console.error('Error getting all restrictions:', error);
      return [];
    }
  }

  /**
   * Clean up expired restrictions
   */
  static async cleanupExpired() {
    try {
      const { data, error } = await supabase
        .from('security_restrictions')
        .update({ is_active: false })
        .lt('expires_at', new Date().toISOString())
        .eq('is_active', true)
        .select();

      if (error) throw error;

      return {
        success: true,
        cleanedCount: data?.length || 0,
        restrictions: data || []
      };
    } catch (error) {
      console.error('Error cleaning up expired restrictions:', error);
      throw error;
    }
  }

  /**
   * Helper: Log restriction events
   */
  static async logRestrictionEvent(userId, eventType, eventData) {
    try {
      const { SecurityEvent } = await import('./securityEvent.js');
      await SecurityEvent.create({
        userId,
        eventType,
        eventData,
        severity: 'WARNING'
      });
    } catch (error) {
      console.error('Error logging restriction event:', error);
    }
  }

  /**
   * Common restriction types
   */
  static getRestrictionTypes() {
    return {
      IP_BAN: 'ip_ban',
      ACCOUNT_SUSPENSION: 'account_suspension',
      LOGIN_RESTRICTION: 'login_restriction',
      API_RATE_LIMIT: 'api_rate_limit',
      FEATURE_RESTRICTION: 'feature_restriction',
      GEOGRAPHIC_RESTRICTION: 'geographic_restriction'
    };
  }
}
