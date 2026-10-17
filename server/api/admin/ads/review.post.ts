import { requireWalletAdmin } from '~/server/utils/wallet'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { sendNotification } from '~/server/utils/send-notification'

/** Approve (runs the ad) or reject (refunds the budget) a campaign in review. */
export default defineEventHandler(async (event) => {
  const admin = await requireWalletAdmin(event)
  const { campaignId, action, note } = await readBody<{ campaignId?: string, action?: 'approve' | 'reject', note?: string }>(event)
  const service = getServiceClient()
  const { data: campaign } = await service.from('ads_campaigns').select('id, title, advertiser_id, status').eq('id', campaignId ?? '').maybeSingle()
  if (!campaign) throw createError({ statusCode: 404, statusMessage: 'Campaign not found' })
  if (campaign.status !== 'PENDING_REVIEW') throw createError({ statusCode: 409, statusMessage: 'Campaign is not in review' })
  const reviewed = { reviewed_by: admin.id, reviewed_at: new Date().toISOString(), review_note: note?.trim() || null }

  if (action === 'approve') {
    const { error } = await service.from('ads_campaigns').update({ ...reviewed, status: 'ACTIVE' } as never).eq('id', campaign.id)
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  } else if (action === 'reject') {
    if (!note?.trim()) throw createError({ statusCode: 400, statusMessage: 'Give the advertiser a reason' })
    await service.from('ads_campaigns').update(reviewed as never).eq('id', campaign.id)
    const { error } = await service.rpc('ad_budget_refund' as never, { p_campaign_id: campaign.id, p_final_status: 'REJECTED' } as never)
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  } else {
    throw createError({ statusCode: 400, statusMessage: 'action must be approve or reject' })
  }

  await sendNotification(
    event,
    campaign.advertiser_id,
    'system',
    action === 'approve'
      ? `Your ad "${campaign.title}" is approved and now running.`
      : `Your ad "${campaign.title}" was not approved: ${note}. The unspent budget was returned to your wallet.`
  )
  return { status: action === 'approve' ? 'ACTIVE' : 'REJECTED' }
})
