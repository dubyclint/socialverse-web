// server/models/ad-analytics.js - Supabase PostgreSQL Ad Analytics Model
import { supabase } from '../utils/supabase.js';

export class AdAnalytics {
  static async createCampaign(campaignData) {
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
  }

  static async recordImpression(adId) {
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
  }

  static async recordClick(adId) {
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
  }

  static async recordConversion(adId, conversionValue = null) {
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
  }

  static async updateCTR(adId) {
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
  }

  static async updateConversionRate(adId) {
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
  }

  static async getCampaignAnalytics(campaignId) {
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
  }

  static async getAdvertiserAnalytics(advertiserId) {
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
  }

  static async getTopPerformingAds(limit = 10, metric = 'ctr') {
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
  }

  static async getAdPerformanceReport(adId) {
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
    const roi = data.spend_amount > 0 ? (((data.conversions * 10) - data.spend_amount) / data.spend_amount * 100).toFixed(2) : 0; // Assuming $10 per conversion

    return {
      ...data,
      metrics: {
        cost_per_click: costPerClick,
        cost_per_conversion: costPerConversion,
        roi_percentage: roi
      }
    };
  }

  static async updateSpend(adId, spendAmount) {
    const { data, error } = await supabase
      .from('ad_analytics')
      .update({ spend_amount: spendAmount })
      .eq('id', adId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async pauseCampaign(adId) {
    const { data, error } = await supabase
      .from('ad_analytics')
      .update({ end_date: new Date().toISOString() })
      .eq('id', adId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getAnalyticsDashboard(advertiserId, dateRange = null) {
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
  }

  static async getAdsByPlacement(placement, limit = 20) {
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
  }

  static async getAdsByType(adType, limit = 20) {
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
  }

  static async getActiveAds() {
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
  }

  static async deleteAd(adId, advertiserId) {
    const { error } = await supabase
      .from('ad_analytics')
      .delete()
      .eq('id', adId)
      .eq('advertiser_id', advertiserId);

    if (error) throw error;
    return { success: true };
  }

  static async getMonthlySpendReport(advertiserId, year, month) {
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
  }
}
