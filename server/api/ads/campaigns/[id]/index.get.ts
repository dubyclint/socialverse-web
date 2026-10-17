import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadOwnCampaign } from '~/server/utils/ad-owner'
import { toAdViews } from '~/server/utils/ads'

/** One campaign with its preview, daily performance and leads. */
export default defineEventHandler(async (event) => {
  const campaign = await loadOwnCampaign(event)
  const service = getServiceClient()
  const since = new Date(Date.now() - 30 * 86400000).toISOString()
  const [{ data: events }, { data: leads }, [preview]] = await Promise.all([
    service.from('ad_interactions').select('interaction_type, cost_incurred, created_at').eq('campaign_id', campaign.id).gte('created_at', since).limit(50000),
    service.from('ad_leads').select('id, answers, created_at, user_id').eq('campaign_id', campaign.id).order('created_at', { ascending: false }).limit(500),
    toAdViews([campaign])
  ])
  const days = new Map<string, { day: string, impressions: number, clicks: number, results: number, spend: number }>()
  for (const row of events ?? []) {
    const day = row.created_at.slice(0, 10)
    const entry = days.get(day) ?? { day, impressions: 0, clicks: 0, results: 0, spend: 0 }
    const type = String(row.interaction_type)
    if (type === 'IMPRESSION') entry.impressions += 1
    else if (type === 'CLICK') entry.clicks += 1
    else entry.results += 1
    entry.spend += Number(row.cost_incurred ?? 0)
    days.set(day, entry)
  }
  return {
    campaign,
    preview,
    daily: [...days.values()].sort((a, b) => a.day.localeCompare(b.day)),
    leads: leads ?? []
  }
})
