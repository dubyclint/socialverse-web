// FILE: /server/models/ad-analytics.ts
// REFACTORED: Lazy-loaded Supabase

// ============================================================================
// LAZY-LOADED SUPABASE CLIENT
// ============================================================================
let supabaseInstance: any = null

async function getSupabase() {
  if (!supabaseInstance) {
    const { createClient } = await import('@supabase/supabase-js')
    supabaseInstance = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseInstance
}

// ============================================================================
// INTERFACES
// ============================================================================
export interface AdAnalytics {
  id: string
  adId: string
  date: string
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  ctr: number
  cpc: number
  cpa: number
  roi: number
  createdAt: string
}

export interface AdPerformance {
  adId: string
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalSpend: number
  totalRevenue: number
  averageCTR: number
  averageCPC: number
  averageCPA: number
  averageROI: number
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class AdAnalyticsModel {
  static async recordMetric(metric: Omit<AdAnalytics, 'id' | 'createdAt'>): Promise<AdAnalytics> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('ad_analytics')
        .insert({
          ...metric,
          createdAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as AdAnalytics
    } catch (error) {
      console.error('[AdAnalyticsModel] Error recording metric:', error)
      throw error
    }
  }

  static async getAdAnalytics(adId: string, startDate: string, endDate: string): Promise<AdAnalytics[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('ad_analytics')
        .select('*')
        .eq('adId', adId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (error) throw error
      return (data || []) as AdAnalytics[]
    } catch (error) {
      console.error('[AdAnalyticsModel] Error fetching analytics:', error)
      throw error
    }
  }

  static async getAdPerformance(adId: string): Promise<AdPerformance | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('ad_performance')
        .select('*')
        .eq('adId', adId)
        .single()

      if (error) {
        console.warn('[AdAnalyticsModel] Performance data not found')
        return null
      }

      return data as AdPerformance
    } catch (error) {
      console.error('[AdAnalyticsModel] Error fetching performance:', error)
      throw error
    }
  }

  static async aggregateMetrics(adId: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      
      // Call Supabase function to aggregate metrics
      const { error } = await supabase.rpc('aggregate_ad_metrics', {
        ad_id: adId
      })

      if (error) throw error
    } catch (error) {
      console.error('[AdAnalyticsModel] Error aggregating metrics:', error)
      throw error
    }
  }
}
