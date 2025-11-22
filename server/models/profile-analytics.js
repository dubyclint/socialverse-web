// server/models/profile-analytics.js - Profile Analytics Management Model
import { supabase } from '../utils/supabase.js';

export class ProfileAnalytics {
  
  /**
   * Get comprehensive profile analytics
   */
  static async getAnalytics(profileId) {
    try {
      const { data, error } = await supabase
        .from('profile_analytics')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // If no analytics exist, create initial record
      if (!data) {
        return await this.initializeAnalytics(profileId);
      }

      return data;
    } catch (error) {
      console.error('Error getting profile analytics:', error);
      throw error;
    }
  }

  /**
   * Initialize analytics for a profile
   */
  static async initializeAnalytics(profileId) {
    try {
      const { data, error } = await supabase
        .from('profile_analytics')
        .insert({
          profile_id: profileId,
          total_views: 0,
          unique_viewers: 0,
          views_today: 0,
          views_this_week: 0,
          views_this_month: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error initializing analytics:', error);
      throw error;
    }
  }

  /**
   * Update analytics data
   */
  static async updateAnalytics(profileId) {
    try {
      const { data, error } = await supabase.rpc('update_profile_analytics', {
        profile_id: profileId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating analytics:', error);
      throw error;
    }
  }

  /**
   * Get engagement metrics
   */
  static async getEngagementMetrics(profileId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('profile_engagement_metrics')
        .select('*')
        .eq('profile_id', profileId)
        .gte('metric_date', startDate.toISOString().slice(0, 10))
        .order('metric_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting engagement metrics:', error);
      return [];
    }
  }

  /**
   * Calculate and store daily engagement metrics
   */
  static async calculateDailyMetrics(profileId, date = null) {
    try {
      const targetDate = date || new Date().toISOString().slice(0, 10);
      const startOfDay = new Date(`${targetDate}T00:00:00Z`);
      const endOfDay = new Date(`${targetDate}T23:59:59Z`);

      // Get views for the day
      const { data: views } = await supabase
        .from('profile_views')
        .select('viewer_id')
        .eq('profile_owner_id', profileId)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      // Get interactions for the day
      const { data: interactions } = await supabase
        .from('profile_interactions')
        .select('*')
        .eq('profile_owner_id', profileId)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      const viewsCount = views?.length || 0;
      const uniqueViewersCount = new Set(views?.filter(v => v.viewer_id).map(v => v.viewer_id)).size;
      const interactionsCount = interactions?.length || 0;
      const engagementRate = viewsCount > 0 ? (interactionsCount / viewsCount) * 100 : 0;

      // Upsert metrics
      const { data, error } = await supabase
        .from('profile_engagement_metrics')
        .upsert({
          profile_id: profileId,
          metric_date: targetDate,
          views_count: viewsCount,
          unique_viewers_count: uniqueViewersCount,
          interactions_count: interactionsCount,
          engagement_rate: Math.round(engagementRate * 100) / 100
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error calculating daily metrics:', error);
      throw error;
    }
  }

  /**
   * Get viewer insights
   */
  static async getViewerInsights(profileId, insightType = null) {
    try {
      let query = supabase
        .from('viewer_insights')
        .select('*')
        .eq('profile_owner_id', profileId)
        .eq('is_active', true);

      if (insightType) {
        query = query.eq('insight_type', insightType);
      }

      query = query.order('generated_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting viewer insights:', error);
      return [];
    }
  }

  /**
   * Generate viewer insights
   */
  static async generateInsights(profileId) {
    try {
      const insights = [];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get recent views data
      const { data: recentViews } = await supabase
        .from('profile_views')
        .select('*')
        .eq('profile_owner_id', profileId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (!recentViews || recentViews.length === 0) {
        return insights;
      }

      // 1. Peak viewing times insight
      const hourlyViews = {};
      recentViews.forEach(view => {
        const hour = new Date(view.created_at).getHours();
        hourlyViews[hour] = (hourlyViews[hour] || 0) + 1;
      });

      const peakHour = Object.entries(hourlyViews)
        .sort(([,a], [,b]) => b - a)[0];

      if (peakHour) {
        insights.push({
          insight_type: 'PEAK_VIEWING_TIME',
          insight_data: {
            peak_hour: parseInt(peakHour[0]),
            peak_views: peakHour[1],
            hourly_distribution: hourlyViews
          },
          insight_period: 'MONTHLY'
        });
      }

      // 2. Top viewer countries insight
      const countryViews = {};
      recentViews.forEach(view => {
        const country = view.location_data?.country || 'Unknown';
        countryViews[country] = (countryViews[country] || 0) + 1;
      });

      const topCountries = Object.entries(countryViews)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

      if (topCountries.length > 0) {
        insights.push({
          insight_type: 'TOP_VIEWER_COUNTRIES',
          insight_data: {
            top_countries: topCountries.map(([country, views]) => ({ country, views })),
            total_countries: Object.keys(countryViews).length
          },
          insight_period: 'MONTHLY'
        });
      }

      // 3. View source analysis
      const sourceViews = {};
      recentViews.forEach(view => {
        sourceViews[view.view_source] = (sourceViews[view.view_source] || 0) + 1;
      });

      const topSources = Object.entries(sourceViews)
        .sort(([,a], [,b]) => b - a);

      if (topSources.length > 0) {
        insights.push({
          insight_type: 'VIEW_SOURCE_ANALYSIS',
          insight_data: {
            top_sources: topSources.map(([source, views]) => ({ source, views })),
            primary_source: topSources[0][0]
          },
          insight_period: 'MONTHLY'
        });
      }

      // 4. Viewer retention insight
      const uniqueViewers = new Set(recentViews.filter(v => v.viewer_id).map(v => v.viewer_id));
      const returningViewers = new Set();
      
      uniqueViewers.forEach(viewerId => {
        const viewerViews = recentViews.filter(v => v.viewer_id === viewerId);
        if (viewerViews.length > 1) {
          returningViewers.add(viewerId);
        }
      });

      const retentionRate = uniqueViewers.size > 0 ? (returningViewers.size / uniqueViewers.size) * 100 : 0;

      insights.push({
        insight_type: 'VIEWER_RETENTION',
        insight_data: {
          total_unique_viewers: uniqueViewers.size,
          returning_viewers: returningViewers.size,
          retention_rate: Math.round(retentionRate * 100) / 100
        },
        insight_period: 'MONTHLY'
      });

      // 5. Growth trend insight
      const dailyViews = {};
      recentViews.forEach(view => {
        const date = new Date(view.created_at).toISOString().slice(0, 10);
        dailyViews[date] = (dailyViews[date] || 0) + 1;
      });

      const dates = Object.keys(dailyViews).sort();
      if (dates.length >= 7) {
        const recentWeek = dates.slice(-7).reduce((sum, date) => sum + dailyViews[date], 0);
        const previousWeek = dates.slice(-14, -7).reduce((sum, date) => sum + (dailyViews[date] || 0), 0);
        const growthRate = previousWeek > 0 ? ((recentWeek - previousWeek) / previousWeek) * 100 : 0;

        insights.push({
          insight_type: 'GROWTH_TREND',
          insight_data: {
            recent_week_views: recentWeek,
            previous_week_views: previousWeek,
            growth_rate: Math.round(growthRate * 100) / 100,
            trend: growthRate > 0 ? 'GROWING' : growthRate < 0 ? 'DECLINING' : 'STABLE'
          },
          insight_period: 'WEEKLY'
        });
      }

      // Store insights in database
      for (const insight of insights) {
        await supabase
          .from('viewer_insights')
          .upsert({
            profile_owner_id: profileId,
            ...insight,
            generated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
          });
      }

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  }

  /**
   * Get profile completeness score
   */
  static async getProfileCompletenessScore(profileId) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (!profile) return 0;

      let score = 0;
      const maxScore = 100;

      // Basic info (40 points)
      if (profile.username) score += 10;
      if (profile.email) score += 10;
      if (profile.avatar_url) score += 20;

      // Profile details (30 points)
      if (profile.bio && profile.bio.length > 10) score += 15;
      if (profile.location) score += 10;
      if (profile.website) score += 5;

      // Verification and activity (30 points)
      if (profile.is_verified) score += 15;
      if (profile.rank && profile.rank !== 'NEWBIE') score += 10;
      if (profile.rank_points > 100) score += 5;

      return Math.min(score, maxScore);
    } catch (error) {
      console.error('Error calculating profile completeness:', error);
      return 0;
    }
  }

  /**
   * Get comparative analytics
   */
  static async getComparativeAnalytics(profileId, compareWithAverage = true) {
    try {
      const userAnalytics = await this.getAnalytics(profileId);
      
      if (!compareWithAverage) {
        return { user: userAnalytics };
      }

      // Get platform averages
      const { data: platformStats } = await supabase
        .from('profile_analytics')
        .select('total_views, unique_viewers, views_this_month');

      if (!platformStats || platformStats.length === 0) {
        return { user: userAnalytics, platform: null };
      }

      const platformAverages = {
        total_views: Math.round(platformStats.reduce((sum, p) => sum + p.total_views, 0) / platformStats.length),
        unique_viewers: Math.round(platformStats.reduce((sum, p) => sum + p.unique_viewers, 0) / platformStats.length),
        views_this_month: Math.round(platformStats.reduce((sum, p) => sum + p.views_this_month, 0) / platformStats.length)
      };

      // Calculate percentiles
      const userPercentiles = {
        total_views: this.calculatePercentile(userAnalytics.total_views, platformStats.map(p => p.total_views)),
        unique_viewers: this.calculatePercentile(userAnalytics.unique_viewers, platformStats.map(p => p.unique_viewers)),
        views_this_month: this.calculatePercentile(userAnalytics.views_this_month, platformStats.map(p => p.views_this_month))
      };

      return {
        user: userAnalytics,
        platform: platformAverages,
        percentiles: userPercentiles
      };
    } catch (error) {
      console.error('Error getting comparative analytics:', error);
      throw error;
    }
  }

  /**
   * Helper: Calculate percentile
   */
  static calculatePercentile(value, dataset) {
    const sorted = dataset.sort((a, b) => a - b);
    const below = sorted.filter(v => v < value).length;
    return Math.round((below / sorted.length) * 100);
  }

  /**
   * Export analytics data
   */
  static async exportAnalytics(profileId, format = 'json') {
    try {
      const [analytics, views, interactions, metrics] = await Promise.all([
        this.getAnalytics(profileId),
        supabase.from('profile_views').select('*').eq('profile_owner_id', profileId),
        supabase.from('profile_interactions').select('*').eq('profile_owner_id', profileId),
        this.getEngagementMetrics(profileId, 90)
      ]);

      const exportData = {
        profile_id: profileId,
        exported_at: new Date().toISOString(),
        analytics: analytics,
        views: views.data || [],
        interactions: interactions.data || [],
        engagement_metrics: metrics,
        summary: {
          total_views: analytics.total_views,
          unique_viewers: analytics.unique_viewers,
          total_interactions: interactions.data?.length || 0,
          data_points: (views.data?.length || 0) + (interactions.data?.length || 0)
        }
      };

      if (format === 'csv') {
        return this.convertToCSV(exportData);
      }

      return exportData;
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  }

  /**
   * Helper: Convert to CSV format
   */
  static convertToCSV(data) {
    // This is a simplified CSV conversion
    // In a real implementation, you'd want a more robust CSV library
    const views = data.views.map(view => ({
      date: view.created_at,
      viewer_id: view.viewer_id || 'anonymous',
      view_type: view.view_type,
      view_source: view.view_source,
      duration: view.view_duration || 0
    }));

    const headers = Object.keys(views[0] || {});
    const csvContent = [
      headers.join(','),
      ...views.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Schedule analytics cleanup
   */
  static async scheduleCleanup(profileId) {
    try {
      // This would typically integrate with a job queue
      // For now, we'll do immediate cleanup based on retention settings
      const { data: privacySettings } = await supabase
        .from('profile_privacy_settings')
        .select('analytics_retention_days')
        .eq('user_id', profileId)
        .single();

      const retentionDays = privacySettings?.analytics_retention_days || 365;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Clean up old views
      await supabase
        .from('profile_views')
        .delete()
        .eq('profile_owner_id', profileId)
        .lt('created_at', cutoffDate.toISOString());

      // Clean up old metrics
      await supabase
        .from('profile_engagement_metrics')
        .delete()
        .eq('profile_id', profileId)
        .lt('created_at', cutoffDate.toISOString());

      return { success: true, cleanupDate: cutoffDate };
    } catch (error) {
      console.error('Error scheduling cleanup:', error);
      throw error;
    }
  }
}
