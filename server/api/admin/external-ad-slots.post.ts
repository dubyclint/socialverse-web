import { serverSupabaseClient } from '#supabase/server'
import { requireAdmin } from '~/server/gateway/auth/auth-utils'
import type { Database } from '~/types/database.types'

type SlotRow = Database['public']['Tables']['external_ad_slots']['Row']

interface SlotPayload {
  id?: string
  label?: string
  provider?: string
  clientId?: string
  slotId?: string
  interestIds?: string[]
  bidPerMille?: number
  isActive?: boolean
}

const PROVIDERS = ['adsense', 'meta', 'taboola', 'outbrain', 'custom']

export default defineEventHandler(async (event): Promise<{ success: boolean, data: SlotRow }> => {
  await requireAdmin(event)
  const body = await readBody<SlotPayload>(event)

  const label = body.label?.trim()
  const provider = (body.provider ?? 'adsense').trim().toLowerCase()
  const clientId = body.clientId?.trim()
  const slotId = body.slotId?.trim()

  if (!label || !clientId || !slotId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'label, clientId and slotId are required'
    })
  }

  if (!PROVIDERS.includes(provider)) {
    throw createError({
      statusCode: 400,
      statusMessage: `provider must be one of: ${PROVIDERS.join(', ')}`
    })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  const values = {
    label,
    provider,
    client_id: clientId,
    slot_id: slotId,
    interest_ids: body.interestIds ?? [],
    bid_per_mille: Math.max(0, Number(body.bidPerMille ?? 0)),
    is_active: body.isActive ?? true
  }

  const query = body.id
    ? supabase.from('external_ad_slots').update(values).eq('id', body.id)
    : supabase.from('external_ad_slots').insert(values)

  const { data, error } = await query.select('*').single()

  if (error) {
    // The 3-active-slot cap is enforced by a database trigger.
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return { success: true, data }
})
