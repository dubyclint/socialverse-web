import { requireWalletAdmin } from '~/server/utils/wallet'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { AD_COLUMNS, DEFAULT_AD_PRICING, DEFAULT_EXTERNAL_ADS, readPlatformConfig, toAdViews } from '~/server/utils/ads'
import type { AdPricing, AdRow, ExternalAdsConfig } from '~/server/utils/ads'

/** Admin/manager ads console: review queue, all campaigns, pricing and networks. */
export default defineEventHandler(async (event) => {
  await requireWalletAdmin(event)
  const status = String(getQuery(event).status ?? 'PENDING_REVIEW')
  let query = getServiceClient().from('ads_campaigns').select(AD_COLUMNS).is('deleted_at', null).order('created_at', { ascending: false }).limit(200)
  if (status !== 'ALL') query = query.eq('status', status as never)
  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  const rows = (data ?? []) as unknown as AdRow[]
  const [previews, pricing, external, serving] = await Promise.all([
    toAdViews(rows),
    readPlatformConfig<AdPricing>('ad_pricing', DEFAULT_AD_PRICING),
    readPlatformConfig<ExternalAdsConfig>('external_ads', DEFAULT_EXTERNAL_ADS),
    readPlatformConfig<Record<string, unknown>>('ad_serving', {})
  ])
  return { campaigns: rows.map((row, i) => ({ ...row, preview: previews[i] })), pricing, external, serving }
})
