import { serverSupabaseClient } from '#supabase/server'
import { requireAdmin } from '~/server/gateway/auth/auth-utils'
import type { Database } from '~/types/database.types'

export interface AdCampaignActivity {
  id: string
  campaign: string
  advertiser: string
  impressions: number
  clicks: number
  revenue: number
  status: string
}

export interface AdAnalyticsResponse {
  analytics: {
    totalImpressions: number
    totalRevenue: number
    ctr: number
    activeCampaigns: number
  }
  recentActivity: AdCampaignActivity[]
}

/** Live campaign performance derived from `ad_interactions` spend rows. */
export default defineEventHandler(async (event): Promise<AdAnalyticsResponse> => {
  await requireAdmin(event)
  const client = await serverSupabaseClient<Database>(event)

  const [{ data: campaigns, error: campaignError }, { data: interactions, error: interactionError }] =
    await Promise.all([
      client
        .from('ads_campaigns')
        .select('id, title, advertiser_id, status, remaining_budget, total_budget')
        .order('created_at', { ascending: false })
        .limit(50),
      client
        .from('ad_interactions')
        .select('campaign_id, interaction_type, cost_incurred')
        .limit(20000)
    ])

  if (campaignError) throw createError({ statusCode: 500, statusMessage: campaignError.message })
  if (interactionError) throw createError({ statusCode: 500, statusMessage: interactionError.message })

  const stats = new Map<string, { impressions: number, clicks: number, revenue: number }>()
  for (const row of interactions ?? []) {
    const entry = stats.get(row.campaign_id) ?? { impressions: 0, clicks: 0, revenue: 0 }
    if (row.interaction_type === 'click') entry.clicks += 1
    else entry.impressions += 1
    entry.revenue += Number(row.cost_incurred ?? 0)
    stats.set(row.campaign_id, entry)
  }

  const advertiserIds = Array.from(new Set((campaigns ?? []).map(row => row.advertiser_id)))
  const { data: advertisers } = advertiserIds.length
    ? await client.from('user').select('user_id, username, display_name').in('user_id', advertiserIds)
    : { data: [] }
  const advertiserById = new Map((advertisers ?? []).map(row => [row.user_id, row]))

  const recentActivity: AdCampaignActivity[] = (campaigns ?? []).map((campaign) => {
    const entry = stats.get(campaign.id) ?? { impressions: 0, clicks: 0, revenue: 0 }
    const advertiser = advertiserById.get(campaign.advertiser_id)
    return {
      id: campaign.id,
      campaign: campaign.title,
      advertiser: advertiser?.display_name || advertiser?.username || 'Unknown advertiser',
      impressions: entry.impressions,
      clicks: entry.clicks,
      revenue: Math.round(entry.revenue * 100) / 100,
      status: campaign.status
    }
  })

  const totalImpressions = recentActivity.reduce((sum, row) => sum + row.impressions, 0)
  const totalClicks = recentActivity.reduce((sum, row) => sum + row.clicks, 0)
  const totalRevenue = recentActivity.reduce((sum, row) => sum + row.revenue, 0)

  return {
    analytics: {
      totalImpressions,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      ctr: totalImpressions ? Math.round((totalClicks / totalImpressions) * 1000) / 10 : 0,
      activeCampaigns: (campaigns ?? []).filter(row => row.status === 'ACTIVE').length
    },
    recentActivity
  }
})
