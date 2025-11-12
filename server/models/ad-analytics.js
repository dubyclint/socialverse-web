// server/models/ad-analytics.js - Supabase PostgreSQL Ad Analytics Model
import { supabase } from '../utils/supabase.js';

export class AdAnalytics {
  static async createCampaign(campaignData) {
    try {
      const { data, error } = await supabase
        .from('ad_analytics')
        .insert([{
          ad_id: campaignData.adId,
          advertiser_id: campaignData.advertiserId,
          ad_type: campaignData.adType,
          placement: campaignData.placement,
          campaign_id: campaignData.campaignId,
          target_audience: campaignData.targetAudience || {},
          spend_currency: campaignData.spendCurrency || 'USD',
          start_date: campaignData.startDate,
          end_date: campaignData.endDate
        }])
        .select(`
          *,
          advertiser:advertiser_id(username, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  static async recordImpression(adId) {
    try {
      // Get current impressions count
      const { data: current } = await supabase
        .from('ad_analytics')
        .select('impressions')
        .eq('id', adId)
        .single();

      const newImpressions = (current?.impressions || 0) + 1;

      const { data, error } = await supabase
        .from('ad_analytics')
        .update({ impressions: newImpressions })
        .eq('id', adId)
        .select()
        .single();

      if (error) throw error;

      // Update CTR after recording impression
      await this.updateCTR(adId);
      return data;
    } catch (error) {
      console.error('Error recording impression:', error);
      throw error;
    }
  }

  static async recordClick(adId) {
    try {
      // Get current clicks count
      const { data: current } = await supabase
        .from('ad_analytics')
        .select('clicks')
        .eq('id', adId)
        .single();

      const newClicks = (current?.clicks || 0) + 1;

      const { data, error } = await supabase
        .from('ad_analytics')
        .update({ clicks: newClicks })
        .eq('id', adId)
        .select()
        .single();

      if (error) throw error;

      // Update CTR after recording click
      await this.updateCTR(adId);
      return data;
    } catch (error) {
      console.error('Error recording click:', error);
      throw error;
    }
  }

  static async recordConversion(adId, conversionValue = null) {
    try {
      // Get current conversions count
      const { data: current } = await supabase
        .from('ad_analytics')
        .select('conversions')
        .eq('id', adId)
        .single();

      const newConversions = (current?.conversions || 0) + 1;

      const { data, error } = await supabase
        .from('ad_analytics')
        .update({ conversions: newConversions })
        .eq('id', adId)
        .select()
        .single();

      if (error) throw error;

      // Update conversion rate after recording conversion
      await this.updateConversionRate(adId);
      return data;
    } catch (error) {
      console.error('Error recording conversion:', error);
      throw error;
    }
  }

  static async updateCTR(adId) {
    try {
      const { data: analytics } = await supabase
        .from('ad_analytics')
        .select('impressions, clicks')
        .eq('id', adId)
        .single();

      if (analytics && analytics.impressions > 0) {
        const ctr = (analytics.clicks / analytics.impressions) * 100;

        const { error } = await supabase
          .from('ad_analytics')
          .update({ ctr: parseFloat(ctr.toFixed(4)) })
          .eq('id', adId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating CTR:', error);
      throw error;
    }
  }

  static async updateConversionRate(adId) {
    try {
      const { data: analytics } = await supabase
        .from('ad_analytics')
        .select('clicks, conversions')
        .eq('id', adId)
        .single();

      if (analytics && analytics.clicks > 0) {
        const conversionRate = (analytics.conversions / analytics.clicks) * 100;

        const { error } = await supabase
          .from('ad_analytics')
          .update({ conversion_rate: parseFloat(conversionRate.toFixed(4)) })
          .eq('id', adId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating conversion rate:', error);
      throw error;
    }
  }

  static async getCampaignAnalytics(campaignId) {
    try {
      const { data, error } = await supabase
        .from('ad_analytics')
        .select(`
          *,
          advertiser:advertiser_id(username, avatar_url)
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      throw error;
    }
  }

  static async getAdvertiserAnalytics(advertiserId) {
    try {
      const { data, error } = await supabase
        .from('ad_analytics')
        .select('*')
        .eq('advertiser_id', advertiserId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate aggregated statistics
      const totalSpend = data.reduce((sum, ad) => sum + (ad.spend_amount || 0), 0);
      const totalImpressions = data.reduce((sum, ad) => sum + (ad.impressions || 0), 0);
      const totalClicks = data.reduce((sum, ad) => sum + (ad.clicks || 0), 0);
      const totalConversions = data.reduce((sum, ad) => sum + (ad.conversions || 0), 0);

      return {
        campaigns: data,
        summary: {
          total_spend: totalSpend,
          total_impressions: totalImpressions,
          total_clicks: totalClicks,
          total_conversions: totalConversions,
          average_ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0,
          average_conversion_rate: totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : 0
        }
      };
    } catch (error) {
      console.error('Error fetching advertiser analytics:', error);
      throw error;
    }
  }

  static async getTopPerformingAds(limit = 10, metric = 'ctr') {
    try {
      const { data, error } = await supabase
        .from('ad_analytics')
        .select(`
          *,
          advertiser:advertiser_id(username, avatar_url)
        `)
        .order(metric, { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching top performing ads:', error);
      throw error;
    }
  }

  static async getAdPerformanceReport(adId) {
    try {
      const { data, error } = await supabase
        .from('ad_analytics')
        .select(`
          *,
          advertiser:advertiser_id(username, avatar_url)
        `)
        .eq('id', adId)
        .single();

      if (error) throw error;

      // Calculate additional metrics
      const costPerClick = data.clicks > 0 ? (data.spend_amount / data.clicks).toFixed(2) : 0;
      const costPerConversion = data.conversions > 0 ? (data.spend_amount / data.conversions).toFixed(2) : 0;
      const roi = data.spend_amount > 0 ? (((data.conversions * 10) - data.spend_amount) / data.spend_amount * 100).toFixed(2) : 0;

      return {
        ...data,
        metrics: {
          cost_per_click: costPerClick,
          cost_per_conversion: costPerConversion,
          roi_percentage: roi
        }
      };
    } catch (error) {
      console.error('Error fetching ad performance report:', error);
      throw error;
    }
  }

  static async updateSpend(adId, spendAmount) {
    try {
      const { data, error } = await supabase
        .from('ad_analytics')
        .update({ spend_amount: spendAmount })
        .eq('id', adId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating spend:', error);
      throw error;
    }
  }

  static async pauseCampaign(adId) {
    try {
      const { data, error } = await supabase
        .from('ad_analytics')
        .update({ end_date: new Date().toISOString() })
        .eq('id', adId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error pausing campaign:', error);
      throw error;
    }
  }

  static async getAnalyticsDashboard(advertiserId, dateRange = null) {
    try {
      let query = supabase
        .from('ad_analytics')
        .select('*')
        .eq('advertiser_id', advertiserId);

      if (dateRange) {
        query = query
          .gte('start_date', dateRange.start)
          .lte('end_date', dateRange.end);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by ad type and placement
      const byAdType = {};
      const byPlacement = {};
      let totalMetrics = {
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0
      };

      data.forEach(ad => {
        // By ad type
        if (!byAdType[ad.ad_type]) {
          byAdType[ad.ad_type] = { spend: 0, impressions: 0, clicks: 0, conversions: 0 };
        }
        byAdType[ad.ad_type].spend += ad.spend_amount || 0;
        byAdType[ad.ad_type].impressions += ad.impressions || 0;
        byAdType[ad.ad_type].clicks += ad.clicks || 0;
        byAdType[ad.ad_type].conversions += ad.conversions || 0;

        // By placement
        if (!byPlacement[ad.placement]) {
          byPlacement[ad.placement] = { spend: 0, impressions: 0, clicks: 0, conversions: 0 };
        }
        byPlacement[ad.placement].spend += ad.spend_amount || 0;
        byPlacement[ad.placement].impressions += ad.impressions || 0;
        byPlacement[ad.placement].clicks += ad.clicks || 0;
        byPlacement[ad.placement].conversions += ad.conversions || 0;

        // Total metrics
        totalMetrics.spend += ad.spend_amount || 0;
        totalMetrics.impressions += ad.impressions || 0;
        totalMetrics.clicks += ad.clicks || 0;
        totalMetrics.conversions += ad.conversions || 0;
      });

      return {
        total_campaigns: data.length,
        total_metrics: totalMetrics,
        by_ad_type: byAdType,
        by_placement: byPlacement,
        overall_ctr: totalMetrics.impressions > 0 ? ((totalMetrics.clicks / totalMetrics.impressions) * 100).toFixed(2) : 0,
        overall_conversion_rate: totalMetrics.clicks > 0 ? ((totalMetrics.conversions / totalMetrics.clicks) * 100).toFixed(2) : 0
      };
    } catch (error) {
      console.error('Error fetching analytics dashboard:', error);
      throw error;
    }
  }

  static async getAdsByPlacement(placement, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('ad_analytics')
        .select(`
          *,
          advertiser:advertiser_id(username, avatar_url)
        `)
        .eq('placement', placement)
        .order('impressions', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching ads by placement:', error);
      throw error;
    }
  }

  static async getAdsByType(adType, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('ad_analytics')
        .select(`
          *,
          advertiser:advertiser_id(username, avatar_url)
        `)
        .eq('ad_type', adType)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching ads by type:', error);
      throw error;
    }
  }

  static async getActiveAds() {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('ad_analytics')
        .select(`
          *,
          advertiser:advertiser_id(username, avatar_url)
        `)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching active ads:', error);
      throw error;
    }
  }

  static async deleteAd(adId, advertiserId) {
    try {
      const { error } = await supabase
        .from('ad_analytics')
        .delete()
        .eq('id', adId)
        .eq('advertiser_id', advertiserId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting ad:', error);
      throw error;
    }
  }

  static async getMonthlySpendReport(advertiserId, year, month) {
    try {
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

      const { data, error } = await supabase
        .from('ad_analytics')
        .select('spend_amount, spend_currency, ad_type, placement, created_at')
        .eq('advertiser_id', advertiserId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      const totalSpend = data.reduce((sum, ad) => sum + (ad.spend_amount || 0), 0);
      const spendByType = {};
      const spendByPlacement = {};

      data.forEach(ad => {
        if (!spendByType[ad.ad_type]) spendByType[ad.ad_type] = 0;
        if (!spendByPlacement[ad.placement]) spendByPlacement[ad.placement] = 0;

        spendByType[ad.ad_type] += ad.spend_amount || 0;
        spendByPlacement[ad.placement] += ad.spend_amount || 0;
      });

      return {
        total_spend: totalSpend,
        spend_by_type: spendByType,
        spend_by_placement: spendByPlacement,
        currency: data[0]?.spend_currency || 'USD',
        ads_count: data.length
      };
    } catch (error) {
      console.error('Error fetching monthly spend report:', error);
      throw error;
    }
  }
}
