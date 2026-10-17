import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadOwnCampaign } from '~/server/utils/ad-owner'
import { parseCampaign } from '~/server/utils/ad-campaign-input'
import type { CampaignInput } from '~/server/utils/ad-campaign-input'

/** Edits a campaign. Changed ads go back to review before they run again. */
export default defineEventHandler(async (event) => {
  const campaign = await loadOwnCampaign(event)
  if (['REJECTED', 'COMPLETED', 'ARCHIVED'].includes(campaign.status)) {
    throw createError({ statusCode: 409, statusMessage: 'This campaign has ended and cannot be edited' })
  }
  const body = await readBody<CampaignInput>(event)
  const { columns } = await parseCampaign(event, body)
  if (columns.funding_source !== campaign.funding_source || columns.page_id !== campaign.page_id) {
    throw createError({ statusCode: 400, statusMessage: 'The advertiser and funding wallet cannot change after publishing' })
  }
  const { error } = await getServiceClient()
    .from('ads_campaigns')
    .update({ ...columns, status: 'PENDING_REVIEW', review_note: null } as never)
    .eq('id', campaign.id)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { id: campaign.id, status: 'PENDING_REVIEW' }
})
