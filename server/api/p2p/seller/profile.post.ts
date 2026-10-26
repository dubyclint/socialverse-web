import { requireSeller } from '~/server/utils/rbac'
import { getServiceClient } from '~/server/utils/supabase-admin'

export default defineEventHandler(async (event) => {
  const seller = await requireSeller(event)
  const body = await readBody<{ displayName?: string, buyerNotes?: string }>(event)
  const { data, error } = await getServiceClient().from('seller_profiles')
    .update({ display_name: String(body.displayName ?? '').trim().slice(0, 60) || null, buyer_notes: String(body.buyerNotes ?? '').trim().slice(0, 1000) || null } as never)
    .eq('user_id', seller.id).select().single()
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { profile: data }
})
