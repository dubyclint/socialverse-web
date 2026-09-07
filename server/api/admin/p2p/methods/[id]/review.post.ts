import { serverSupabaseClient } from '#supabase/server'
import { requireRole } from '~/server/utils/rbac'
import type { Database } from '~/types/database.types'

interface ReviewBody {
  approve?: boolean
  reason?: string
}

/** Admin verification of a payout method against the seller's KYC identity. */
export default defineEventHandler(async (event) => {
  const actor = await requireRole(event, 'manager')
  const id = getRouterParam(event, 'id')
  const body = await readBody<ReviewBody>(event)
  const supabase = await serverSupabaseClient<Database>(event)

  if (!id) throw createError({ statusCode: 400, statusMessage: 'Method id is required' })
  if (body?.approve === undefined) throw createError({ statusCode: 400, statusMessage: 'approve is required' })
  if (!body.approve && !body.reason) {
    throw createError({ statusCode: 400, statusMessage: 'A rejection reason is required' })
  }

  const { data, error } = await supabase
    .from('seller_payment_methods')
    .update({
      status: body.approve ? 'APPROVED' : 'REJECTED',
      reviewed_by: actor.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: body.approve ? null : body.reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Method not found' })
  return { method: data }
})
