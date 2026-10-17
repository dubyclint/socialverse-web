import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadOwnCampaign } from '~/server/utils/ad-owner'
import { requirePageRole } from '~/server/utils/actor'

/** Adds PEW from the funding wallet to a campaign's budget. */
export default defineEventHandler(async (event) => {
  const campaign = await loadOwnCampaign(event)
  if (['REJECTED', 'COMPLETED', 'ARCHIVED'].includes(campaign.status)) {
    throw createError({ statusCode: 409, statusMessage: 'This campaign has ended' })
  }
  if (campaign.funding_source === 'PAGE' && campaign.page_id) await requirePageRole(event, campaign.page_id, ['OWNER', 'MANAGER'])
  const { amount } = await readBody<{ amount?: number }>(event)
  const value = Number(amount)
  if (!Number.isFinite(value) || value <= 0) throw createError({ statusCode: 400, statusMessage: 'Enter a positive amount' })
  const { error } = await getServiceClient().rpc('ad_budget_hold' as never, { p_campaign_id: campaign.id, p_amount: value } as never)
  if (error) {
    const insufficient = /insufficient/i.test(error.message)
    throw createError({ statusCode: insufficient ? 402 : 500, statusMessage: insufficient ? 'Not enough PEW in the wallet' : error.message })
  }
  return { added: value }
})
