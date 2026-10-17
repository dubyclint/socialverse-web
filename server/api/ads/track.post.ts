import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { getServiceClient } from '~/server/utils/supabase-admin'

const TYPES = ['IMPRESSION', 'CLICK', 'MESSAGE', 'CONVERSION'] as const
type AdInteraction = typeof TYPES[number]

/** Records an ad impression (charged at CPM), click, message or conversion. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{ campaignId?: string, interactionType?: AdInteraction, placement?: string, cta?: string }>(event)
  if (!body?.campaignId || !TYPES.includes(body.interactionType as AdInteraction)) {
    throw createError({ statusCode: 400, statusMessage: 'campaignId and interactionType are required' })
  }
  const { data, error } = await getServiceClient().rpc('record_ad_interaction' as never, {
    p_campaign_id: body.campaignId,
    p_viewer_id: user.id,
    p_interaction: body.interactionType,
    p_metadata: { placement: String(body.placement ?? 'feed').slice(0, 30), cta: String(body.cta ?? '').slice(0, 30) }
  } as never)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { success: true, data: { cost: Number(data ?? 0) } }
})
