// models/userSession.js - User Session Management Model
import { supabase } from '../utils/supabase.js';
import crypto from 'crypto';

export class userSession {
  
  /**
   * Create a new user session
   */
  static async create(sessionData) {
    try {
      const sessionToken = this.generateSessionToken();
      
      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: sessionData.userId,
          session_token: sessionToken,
          device_info: sessionData.deviceInfo || {},
          ip_address: sessionData.ipAddress,
          user_agent: sessionData.userAgent,
          location_data: sessionData.locationData || {},
          is_active: true,
          last_activity: new Date().toISOString(),
          expires_at: sessionData.expiresAt || this.calculateExpiryDate()
        })
        .select()
        .single();

      if (error) throw error;

      // Log session creation
      await this.logsecurityevent(sessionData.userId, 'SESSION_CREATED', {
        session_id: data.id,
        ip_address: sessionData.ipAddress,
        user_agent: sessionData.userAgent
      });

      return data;
    } catch (error) {
      console.error('Error creating user session:', error);
      throw error;
    }
  }

  /**
   * Find session by token
   */
  static async findByToken(sessionToken) {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          *,
          user_profile:user_id(username, email, role)
        `)
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error finding session by token:', error);
      throw error;
    }
  }

  /**
   * Find user sessions
   */
  static async finduserSessions(userId, activeOnly = true) {
    try {
      let query = supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId);

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      query = query.order('last_activity', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error finding user sessions:', error);
      return [];
    }
  }

  /**
   * Update session activity
   */
  static async updateActivity(sessionToken, activityData = {}) {
    try {
      const updateData = {
        last_activity: new Date().toISOString(),
        ...activityData
      };

      const { data, error } = await supabase
        .from('user_sessions')
        .update(updateData)
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating session activity:', error);
      throw error;
    }
  }

  /**
   * Terminate session
   */
  static async terminate(sessionToken, reason = 'Manual logout', terminatedBy = null) {
    try {
      const session = await this.findByToken(sessionToken);
      if (!session) {
        throw new Error('Session not found');
      }

      const { data, error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          terminated_at: new Date().toISOString(),
          termination_reason: reason
        })
        .eq('session_token', sessionToken)
        .select()
        .single();

      if (error) throw error;

      // Log session termination
      await this.logsecurityevent(session.user_id, 'SESSION_TERMINATED', {
        session_id: session.id,
        reason: reason,
        terminated_by: terminatedBy,
        ip_address: session.ip_address
      });

      return data;
    } catch (error) {
      console.error('Error terminating session:', error);
      throw error;
    }
  }

  /**
   * Terminate all user sessions except current
   */
  static async terminateAllExcept(userId, currentSessionToken, reason = 'Security logout') {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          terminated_at: new Date().toISOString(),
          termination_reason: reason
        })
        .eq('user_id', userId)
        .eq('is_active', true)
        .neq('session_token', currentSessionToken)
        .select();

      if (error) throw error;

      // Log mass session termination
      await this.logsecurityevent(userId, 'MASS_SESSION_TERMINATION', {
        terminated_count: data?.length || 0,
        reason: reason,
        kept_session: currentSessionToken
      });

      return {
        success: true,
        terminatedCount: data?.length || 0,
        sessions: data || []
      };
    } catch (error) {
      console.error('Error terminating all sessions:', error);
      throw error;
    }
  }

  /**
   * Validate session
   */
  static async validateSession(sessionToken) {
    try {
      const session = await this.findByToken(sessionToken);
      
      if (!session) {
        return { valid: false, reason: 'Session not found' };
      }

      // Check if session is expired
      if (session.expires_at && new Date() > new Date(session.expires_at)) {
        await this.terminate(sessionToken, 'Session expired');
        return { valid: false, reason: 'Session expired' };
      }

      // Check for suspicious activity
      const suspiciousActivity = await this.checkSuspiciousActivity(session);
      if (suspiciousActivity.isSuspicious) {
        await this.terminate(sessionToken, `Suspicious activity: ${suspiciousActivity.reason}`);
        await this.logsecurityevent(session.user_id, 'SUSPICIOUS_ACTIVITY_DETECTED', suspiciousActivity);
        return { valid: false, reason: 'Suspicious activity detected' };
      }

      // Update last activity
      await this.updateActivity(sessionToken);

      return { 
        valid: true, 
        session: session,
        user: session.user_profile
      };
    } catch (error) {
      console.error('Error validating session:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  /**
   * Check for suspicious activity
   */
  static async checkSuspiciousActivity(session) {
    try {
      const checks = [];

      // Check for multiple rapid logins from different IPs
      const recentSessions = await supabase
        .from('user_sessions')
        .select('ip_address, created_at')
        .eq('user_id', session.user_id)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order('created_at', { ascending: false });

      if (recentSessions.data && recentSessions.data.length > 5) {
        const uniqueIPs = new Set(recentSessions.data.map(s => s.ip_address));
        if (uniqueIPs.size > 3) {
          checks.push('Multiple IPs in short time');
        }
      }

      // Check for unusual location
      if (session.location_data && session.location_data.country) {
        const userSessions = await supabase
          .from('user_sessions')
          .select('location_data')
          .eq('user_id', session.user_id)
          .not('location_data', 'is', null)
          .limit(10);

        if (userSessions.data && userSessions.data.length > 0) {
          const commonCountries = userSessions.data
            .map(s => s.location_data?.country)
            .filter(Boolean);
          
          const currentCountry = session.location_data.country;
          const isCommonLocation = commonCountries.includes(currentCountry);
          
          if (!isCommonLocation && commonCountries.length > 3) {
            checks.push('Unusual location');
          }
        }
      }

      // Check session age vs activity
      const sessionAge = Date.now() - new Date(session.created_at).getTime();
      const lastActivity = Date.now() - new Date(session.last_activity).getTime();
      
      if (sessionAge > 24 * 60 * 60 * 1000 && lastActivity < 5 * 60 * 1000) {
        checks.push('Old session with recent activity');
      }

      return {
        isSuspicious: checks.length > 0,
        reason: checks.join(', '),
        checks: checks
      };
    } catch (error) {
      console.error('Error checking suspicious activity:', error);
      return { isSuspicious: false, reason: 'Check failed' };
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpired() {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          terminated_at: new Date().toISOString(),
          termination_reason: 'Expired'
        })
        .lt('expires_at', new Date().toISOString())
        .eq('is_active', true)
        .select();

      if (error) throw error;

      return {
        success: true,
        cleanedCount: data?.length || 0,
        sessions: data || []
      };
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      throw error;
    }
  }

  /**
   * Get session statistics
   */
  static async getStatistics(userId = null) {
    try {
      let query = supabase
        .from('user_sessions')
        .select('user_id, is_active, created_at, ip_address');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = {
        total: data.length,
        active: data.filter(s => s.is_active).length,
        inactive: data.filter(s => !s.is_active).length,
        uniqueUsers: new Set(data.map(s => s.user_id)).size,
        uniqueIPs: new Set(data.map(s => s.ip_address)).size
      };

      if (userId) {
        const userSessions = data.filter(s => s.user_id === userId);
        stats.userSessions = {
          total: userSessions.length,
          active: userSessions.filter(s => s.is_active).length,
          uniqueIPs: new Set(userSessions.map(s => s.ip_address)).size
        };
      }

      return stats;
    } catch (error) {
      console.error('Error getting session statistics:', error);
      throw error;
    }
  }

  /**
   * Force disconnect user
   */
  static async forceDisconnect(userId, reason = 'Administrative action', adminId = null) {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          terminated_at: new Date().toISOString(),
          termination_reason: reason
        })
        .eq('user_id', userId)
        .eq('is_active', true)
        .select();

      if (error) throw error;

      // Log force disconnect
      await this.logSecurityEvent(userId, 'FORCE_DISCONNECT', {
        terminated_count: data?.length || 0,
        reason: reason,
        admin_id: adminId
      });

      return {
        success: true,
        terminatedCount: data?.length || 0,
        sessions: data || []
      };
    } catch (error) {
      console.error('Error force disconnecting user:', error);
      throw error;
    }
  }

  /**
   * Helper: Generate session token
   */
  static generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Helper: Calculate expiry date
   */
  static calculateExpiryDate(days = 30) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    return expiryDate.toISOString();
  }

  /**
   * Helper: Log security events
   */
  static async logSecurityEvent(userId, eventType, eventData) {
    try {
      await supabase
        .from('security_events')
        .insert({
          user_id: userId,
          event_type: eventType,
          event_data: eventData,
          ip_address: eventData.ip_address,
          user_agent: eventData.user_agent,
          severity: this.getEventSeverity(eventType),
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Helper: Get event severity
   */
  static getEventSeverity(eventType) {
    const severityMap = {
      'SESSION_CREATED': 'INFO',
      'SESSION_TERMINATED': 'INFO',
      'SUSPICIOUS_ACTIVITY_DETECTED': 'WARNING',
      'MASS_SESSION_TERMINATION': 'WARNING',
      'FORCE_DISCONNECT': 'CRITICAL'
    };
    return severityMap[eventType] || 'INFO';
  }
}
