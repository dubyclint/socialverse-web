import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { AD_COLUMNS } from '~/server/utils/ads'
import type { AdRow } from '~/server/utils/ads'

/** The signed-in advertiser's campaigns with totals for the Ads Manager home. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { data, error } = await getServiceClient()
    .from('ads_campaigns')
    .select(AD_COLUMNS)
    .eq('advertiser_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  const campaigns = (data ?? []) as unknown as AdRow[]
  const totals = campaigns.reduce((acc, c) => {
    acc.impressions += Number(c.impressions_count)
    acc.clicks += Number(c.clicks_count)
    acc.results += Number(c.results_count)
    acc.spent += Number(c.spent)
    acc.remaining += Number(c.remaining_budget)
    if (c.status === 'ACTIVE') acc.active += 1
    return acc
  }, { impressions: 0, clicks: 0, results: 0, spent: 0, remaining: 0, active: 0 })
  return { campaigns, totals }
})
