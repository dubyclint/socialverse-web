import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { getServiceClient } from '~/server/utils/supabase-admin'

type AdInteraction = 'IMPRESSION' | 'CLICK'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{ campaignId?: string, interactionType?: AdInteraction }>(event)

  const campaignId = body?.campaignId
  const interactionType = body?.interactionType

  if (!campaignId || (interactionType !== 'IMPRESSION' && interactionType !== 'CLICK')) {
    throw createError({ statusCode: 400, statusMessage: 'campaignId and interactionType are required' })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase.rpc('record_ad_interaction', {
    p_campaign_id: campaignId,
    p_viewer_id: user.id,
    p_interaction: interactionType
  })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true, data: { cost: Number(data ?? 0) } }
})
