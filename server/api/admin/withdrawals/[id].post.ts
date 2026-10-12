import { createError, getRouterParam, readBody } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireWalletAdmin } from '~/server/utils/wallet'

/** processing = paying out, successful = paid, failed = rejected (PEW returned to the user). */
export default defineEventHandler(async (event) => {
  const admin = await requireWalletAdmin(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ status: string, note?: string }>(event)
  if (!id || !['processing', 'successful', 'failed'].includes(body?.status)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
  }

  const { error } = await getServiceClient().rpc('resolve_withdrawal', {
    p_id: id,
    p_status: body.status,
    p_note: body.note?.slice(0, 500) ?? null,
    p_admin: admin.id
  })
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { id, status: body.status }
})
