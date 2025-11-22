// server/models/profile-view.js - Profile Views Tracking Model
import { supabase } from '../utils/supabase.js';

export class ProfileView {
  
  /**
   * Record a profile view
   */
  static async recordView(viewData) {
    try {
      const { data, error } = await supabase.rpc('record_profile_view', {
        owner_id: viewData.profileOwnerId,
        viewer_id: viewData.viewerId || null,
        view_type: viewData.viewType || 'PROFILE',
        view_source: viewData.viewSource || 'DIRECT',
        viewer_ip: viewData.viewerIP || null,
        user_agent: viewData.userAgent || null,
        device_info: viewData.deviceInfo || {},
        location_data: viewData.locationData || {},
        referrer_url: viewData.referrerUrl || null
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error recording profile view:', error);
      throw error;
    }
  }

  /**
   * Get profile views for a user
   */
  static async getProfileViews(profileOwnerId, filters = {}) {
    try {
      let query = supabase
        .from('profile_views')
        .select(`
          *,
          viewer_profile:viewer_id(username, avatar_url, email)
        `)
        .eq('profile_owner_id', profileOwnerId);

      if (filters.viewType) {
        query = query.eq('view_type', filters.viewType);
      }

      if (filters.since) {
        query = query.gte('created_at', filters.since);
      }

      if (filters.viewerOnly && !filters.includeAnonymous) {
        query = query.not('viewer_id', 'is', null);
      }

      query = query.order('created_at', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting profile views:', error);
      return [];
    }
  }

  /**
   * Get profile viewers (unique viewers)
   */
  static async getProfileViewers(profileOwnerId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase.rpc('get_profile_viewers', {
        owner_id: profileOwnerId,
        limit_count: limit,
        offset_count: offset
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting profile viewers:', error);
      return [];
    }
  }

  /**
   * Get view statistics
   */
  static async getViewStatistics(profileOwnerId, timeframe = '30d') {
    try {
      const timeframeDates = {
        '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
        '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        '90d': new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      };

      const since = timeframeDates[timeframe] || timeframeDates['30d'];

      const { data, error } = await supabase
        .from('profile_views')
        .select('view_type, view_source, created_at, viewer_id, location_data')
        .eq('profile_owner_id', profileOwnerId)
        .gte('created_at', since.toISOString());

      if (error) throw error;

      const stats = {
        totalViews: data.length,
        uniqueViewers: new Set(data.filter(v => v.viewer_id).map(v => v.viewer_id)).size,
        anonymousViews: data.filter(v => !v.viewer_id).length,
        viewsByType: {},
        viewsBySource: {},
        viewsByCountry: {},
        dailyViews: {},
        hourlyViews: {}
      };

      data.forEach(view => {
        // Count by type
        stats.viewsByType[view.view_type] = (stats.viewsByType[view.view_type] || 0) + 1;
        
        // Count by source
        stats.viewsBySource[view.view_source] = (stats.viewsBySource[view.view_source] || 0) + 1;
        
        // Count by country
        const country = view.location_data?.country || 'Unknown';
        stats.viewsByCountry[country] = (stats.viewsByCountry[country] || 0) + 1;
        
        // Count by day
        const day = new Date(view.created_at).toISOString().slice(0, 10);
        stats.dailyViews[day] = (stats.dailyViews[day] || 0) + 1;
        
        // Count by hour
        const hour = new Date(view.created_at).getHours();
        stats.hourlyViews[hour] = (stats.hourlyViews[hour] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting view statistics:', error);
      throw error;
    }
  }

  /**
   * Get recent viewers with details
   */
  static async getRecentViewers(profileOwnerId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('profile_views')
        .select(`
          *,
          viewer_profile:viewer_id(
            id, username, avatar_url, email,
            rank, is_verified
          )
        `)
        .eq('profile_owner_id', profileOwnerId)
        .not('viewer_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Group by viewer and get latest view
      const viewerMap = new Map();
      data.forEach(view => {
        if (!viewerMap.has(view.viewer_id) || 
            new Date(view.created_at) > new Date(viewerMap.get(view.viewer_id).created_at)) {
          viewerMap.set(view.viewer_id, view);
        }
      });

      return Array.from(viewerMap.values());
    } catch (error) {
      console.error('Error getting recent viewers:', error);
      return [];
    }
  }

  /**
   * Check if user can view profile analytics
   */
  static async canViewAnalytics(profileOwnerId, requesterId) {
    try {
      // Profile owner can always view their analytics
      if (profileOwnerId === requesterId) {
        return true;
      }

      // Check privacy settings
      const { data: privacySettings } = await supabase
        .from('profile_privacy_settings')
        .select('show_analytics')
        .eq('user_id', profileOwnerId)
        .single();

      return privacySettings?.show_analytics || false;
    } catch (error) {
      console.error('Error checking analytics permission:', error);
      return false;
    }
  }

  /**
   * Get view trends
   */
  static async getViewTrends(profileOwnerId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('profile_views')
        .select('created_at, viewer_id')
        .eq('profile_owner_id', profileOwnerId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const trends = {
        daily: {},
        growth: [],
        peakHours: {}
      };

      // Calculate daily views
      data.forEach(view => {
        const date = new Date(view.created_at).toISOString().slice(0, 10);
        const hour = new Date(view.created_at).getHours();
        
        trends.daily[date] = (trends.daily[date] || 0) + 1;
        trends.peakHours[hour] = (trends.peakHours[hour] || 0) + 1;
      });

      // Calculate growth rate
      const dates = Object.keys(trends.daily).sort();
      for (let i = 1; i < dates.length; i++) {
        const current = trends.daily[dates[i]];
        const previous = trends.daily[dates[i - 1]];
        const growthRate = previous > 0 ? ((current - previous) / previous) * 100 : 0;
        
        trends.growth.push({
          date: dates[i],
          views: current,
          growthRate: Math.round(growthRate * 100) / 100
        });
      }

      return trends;
    } catch (error) {
      console.error('Error getting view trends:', error);
      throw error;
    }
  }

  /**
   * Update view duration
   */
  static async updateViewDuration(viewId, duration) {
    try {
      const { data, error } = await supabase
        .from('profile_views')
        .update({ view_duration: duration })
        .eq('id', viewId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating view duration:', error);
      throw error;
    }
  }

  /**
   * Clean up old views based on privacy settings
   */
  static async cleanupOldViews(profileOwnerId) {
    try {
      // Get user's retention settings
      const { data: privacySettings } = await supabase
        .from('profile_privacy_settings')
        .select('analytics_retention_days')
        .eq('user_id', profileOwnerId)
        .single();

      const retentionDays = privacySettings?.analytics_retention_days || 365;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { data, error } = await supabase
        .from('profile_views')
        .delete()
        .eq('profile_owner_id', profileOwnerId)
        .lt('created_at', cutoffDate.toISOString())
        .select();

      if (error) throw error;

      return {
        success: true,
        deletedCount: data?.length || 0
      };
    } catch (error) {
      console.error('Error cleaning up old views:', error);
      throw error;
    }
  }
}
