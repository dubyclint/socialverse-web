import { serverSupabaseClient } from '#supabase/server'
import { requireAdmin } from '~/server/gateway/auth/auth-utils'
import type { Database } from '~/types/database.types'

type Action = 'approve' | 'reject' | 'revoke'

interface Body {
  requestId?: string
  userId?: string
  action?: Action
  reason?: string
}

const REQUEST_STATUS: Record<Action, string> = {
  approve: 'approved',
  reject: 'rejected',
  revoke: 'revoked'
}

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody<Body>(event)

  if (!body.requestId || !body.userId) {
    throw createError({ statusCode: 400, statusMessage: 'requestId and userId are required' })
  }

  const action = body.action
  if (!action || !(action in REQUEST_STATUS)) {
    throw createError({ statusCode: 400, statusMessage: 'action must be approve, reject or revoke' })
  }

  const client = await serverSupabaseClient<Database>(event)
  const now = new Date().toISOString()

  const { error: requestError } = await client
    .from('badge_requests')
    .update({
      status: REQUEST_STATUS[action],
      reason: body.reason ?? null,
      reviewed_by: admin.id,
      updated_at: now
    })
    .eq('id', body.requestId)

  if (requestError) throw createError({ statusCode: 500, statusMessage: requestError.message })

  const verified = action === 'approve'
  const { error: userError } = await client
    .from('user')
    .update({
      is_verified: verified,
      verified_at: verified ? now : null,
      updated_at: now
    })
    .eq('user_id', body.userId)

  if (userError) throw createError({ statusCode: 500, statusMessage: userError.message })

  return { success: true, status: REQUEST_STATUS[action], isVerified: verified }
})
