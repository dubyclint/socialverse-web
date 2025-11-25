// server/models/ad-analytics.ts
// Ad Analytics Model

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AdAnalytics {
  id: string
  ad_id: string
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  conversion_rate: number
  spend: number
  revenue: number
  created_at: string
  updated_at: string
}

export class AdAnalyticsModel {
  static async getByAdId(adId: string): Promise<AdAnalytics | null> {
    try {
      const { data, error } = await supabase
        .from('ad_analytics')
        .select('*')
        .eq('ad_id', adId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as AdAnalytics) || null
    } catch (error) {
      console.error('[AdAnalyticsModel] Get by ad ID error:', error)
      throw error
    }
  }

  static async recordImpression(adId: string): Promise<void> {
    try {
      const analytics = await this.getByAdId(adId)
      if (!analytics) return

      await supabase
        .from('ad_analytics')
        .update({
          impressions: analytics.impressions + 1,
          updated_at: new Date().toISOString()
        })
        .eq('ad_id', adId)
    } catch (error) {
      console.error('[AdAnalyticsModel] Record impression error:', error)
      throw error
    }
  }

  static async recordClick(adId: string): Promise<void> {
    try {
      const analytics = await this.getByAdId(adId)
      if (!analytics) return

      const newClicks = analytics.clicks + 1
      const ctr = (newClicks / analytics.impressions) * 100

      await supabase
        .from('ad_analytics')
        .update({
          clicks: newClicks,
          ctr,
          updated_at: new Date().toISOString()
        })
        .eq('ad_id', adId)
    } catch (error) {
      console.error('[AdAnalyticsModel] Record click error:', error)
      throw error
    }
  }

  static async recordConversion(adId: string, amount: number): Promise<void> {
    try {
      const analytics = await this.getByAdId(adId)
      if (!analytics) return

      const newConversions = analytics.conversions + 1
      const conversionRate = (newConversions / analytics.clicks) * 100

      await supabase
        .from('ad_analytics')
        .update({
          conversions: newConversions,
          conversion_rate: conversionRate,
          revenue: analytics.revenue + amount,
          updated_at: new Date().toISOString()
        })
        .eq('ad_id', adId)
    } catch (error) {
      console.error('[AdAnalyticsModel] Record conversion error:', error)
      throw error
    }
  }
}

export default AdAnalyticsModel
