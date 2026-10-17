import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireAdmin } from '~/server/gateway/auth/auth-utils'
import type { Database } from '~/types/database.types'

type CampaignStatus = Database['public']['Enums']['ad_campaign_lifecycle_status']

interface Body {
  campaignId?: string
  status?: string
}

const STATUSES: CampaignStatus[] = ['ACTIVE', 'PAUSED', 'COMPLETED']

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<Body>(event)

  if (!body.campaignId) throw createError({ statusCode: 400, statusMessage: 'campaignId is required' })
  const status = STATUSES.find(value => value === body.status)
  if (!status) throw createError({ statusCode: 400, statusMessage: 'Unsupported campaign status' })

  const client = getServiceClient()
  if (status === 'COMPLETED') {
    const { error: refundError } = await client.rpc('ad_budget_refund' as never, { p_campaign_id: body.campaignId, p_final_status: 'COMPLETED' } as never)
    if (refundError) throw createError({ statusCode: 500, statusMessage: refundError.message })
    return { success: true, status }
  }
  const { error } = await client
    .from('ads_campaigns')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', body.campaignId)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true, status }
})
