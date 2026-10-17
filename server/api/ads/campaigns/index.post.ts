import { getServiceClient } from '~/server/utils/supabase-admin'
import { parseCampaign } from '~/server/utils/ad-campaign-input'
import type { CampaignInput } from '~/server/utils/ad-campaign-input'

/** Publishes a campaign: validates it, holds the budget, queues it for review. */
export default defineEventHandler(async (event) => {
  const body = await readBody<CampaignInput>(event)
  const { userId, pricing, columns } = await parseCampaign(event, body)
  const budget = Number(body.budget)
  if (!Number.isFinite(budget) || budget < pricing.min_budget_pew) {
    throw createError({ statusCode: 400, statusMessage: `Budget must be at least ${pricing.min_budget_pew} PEW` })
  }

  const service = getServiceClient()
  const { data, error } = await service
    .from('ads_campaigns')
    .insert({ ...columns, advertiser_id: userId, total_budget: 0, remaining_budget: 0, status: 'PENDING_REVIEW' } as never)
    .select('id')
    .single()
  if (error || !data) throw createError({ statusCode: 500, statusMessage: error?.message ?? 'Could not create campaign' })

  const { error: holdError } = await service.rpc('ad_budget_hold' as never, { p_campaign_id: data.id, p_amount: budget } as never)
  if (holdError) {
    await service.from('ads_campaigns').delete().eq('id', data.id)
    const insufficient = /insufficient/i.test(holdError.message)
    throw createError({
      statusCode: insufficient ? 402 : 500,
      statusMessage: insufficient ? 'Not enough PEW in the wallet for this budget. Add funds and try again.' : holdError.message
    })
  }
  return { id: data.id, status: 'PENDING_REVIEW' }
})
