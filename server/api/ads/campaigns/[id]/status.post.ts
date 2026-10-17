import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadOwnCampaign } from '~/server/utils/ad-owner'

/** Pause, resume or end a campaign. Ending refunds the unspent budget. */
export default defineEventHandler(async (event) => {
  const campaign = await loadOwnCampaign(event)
  const { action } = await readBody<{ action?: 'pause' | 'resume' | 'end' }>(event)
  const service = getServiceClient()

  if (action === 'end') {
    const { data, error } = await service.rpc('ad_budget_refund' as never, { p_campaign_id: campaign.id, p_final_status: 'COMPLETED' } as never)
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    return { status: 'COMPLETED', refunded: Number(data ?? 0) }
  }
  const next = action === 'pause' ? 'PAUSED' : action === 'resume' ? 'ACTIVE' : null
  if (!next) throw createError({ statusCode: 400, statusMessage: 'action must be pause, resume or end' })
  if (next === 'ACTIVE' && campaign.status !== 'PAUSED') {
    throw createError({ statusCode: 409, statusMessage: campaign.status === 'PENDING_REVIEW' ? 'This ad is still in review' : 'Only paused campaigns can be resumed' })
  }
  if (next === 'PAUSED' && campaign.status !== 'ACTIVE') throw createError({ statusCode: 409, statusMessage: 'Only running campaigns can be paused' })
  const { error } = await service.from('ads_campaigns').update({ status: next } as never).eq('id', campaign.id)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { status: next }
})
