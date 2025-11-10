// server/models/security-event.js - Security Events Management Model
import { supabase } from '../utils/supabase.js';

export class SecurityEvent {
  
  /**
   * Create a new security event
   */
  static async create(eventData) {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .insert({
          user_id: eventData.userId,
          event_type: eventData.eventType,
          event_data: eventData.eventData || {},
          ip_address: eventData.ipAddress,
          user_agent: eventData.userAgent,
          severity: eventData.severity || 'INFO'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating security event:', error);
      throw error;
    }
  }

  /**
   * Get user security events
   */
  static async getUserEvents(userId, filters = {}) {
    try {
      let query = supabase
        .from('security_events')
        .select('*')
        .eq('user_id', userId);

      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }

      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters.since) {
        query = query.gte('created_at', filters.since);
      }

      query = query.order('created_at', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting user security events:', error);
      return [];
    }
  }

  /**
   * Get all security events (admin)
   */
  static async getAllEvents(filters = {}) {
    try {
      let query = supabase
        .from('security_events')
        .select(`
          *,
          user_profile:user_id(username, email)
        `);

      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }

      if (filters.since) {
        query = query.gte('created_at', filters.since);
      }

      query = query.order('created_at', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting all security events:', error);
      return [];
    }
  }

  /**
   * Get security statistics
   */
  static async getStatistics(userId = null, timeframe = '24h') {
    try {
      const timeframeDates = {
        '1h': new Date(Date.now() - 60 * 60 * 1000),
        '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
        '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      };

      const since = timeframeDates[timeframe] || timeframeDates['24h'];

      let query = supabase
        .from('security_events')
        .select('event_type, severity, created_at')
        .gte('created_at', since.toISOString());

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = {
        total: data.length,
        bySeverity: {},
        byEventType: {},
        timeline: {}
      };

      data.forEach(event => {
        // Count by severity
        stats.bySeverity[event.severity] = (stats.bySeverity[event.severity] || 0) + 1;
        
        // Count by event type
        stats.byEventType[event.event_type] = (stats.byEventType[event.event_type] || 0) + 1;
        
        // Timeline (by hour)
        const hour = new Date(event.created_at).toISOString().slice(0, 13);
        stats.timeline[hour] = (stats.timeline[hour] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting security statistics:', error);
      throw error;
    }
  }

  /**
   * Clean up old events
   */
  static async cleanupOldEvents(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await supabase
        .from('security_events')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select();

      if (error) throw error;

      return {
        success: true,
        deletedCount: data?.length || 0
      };
    } catch (error) {
      console.error('Error cleaning up old events:', error);
      throw error;
    }
  }
}
