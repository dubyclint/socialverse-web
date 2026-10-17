import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadOwnCampaign } from '~/server/utils/ad-owner'

/** Deletes a campaign and returns any unspent budget to the funding wallet. */
export default defineEventHandler(async (event) => {
  const campaign = await loadOwnCampaign(event)
  const service = getServiceClient()
  const { data: refunded, error } = await service.rpc('ad_budget_refund' as never, { p_campaign_id: campaign.id, p_final_status: 'ARCHIVED' } as never)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  await service.from('ads_campaigns').update({ deleted_at: new Date().toISOString() } as never).eq('id', campaign.id)
  return { deleted: true, refunded: Number(refunded ?? 0) }
})
