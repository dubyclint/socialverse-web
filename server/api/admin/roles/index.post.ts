import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '~/server/utils/auth'

interface Body {
  userId?: string
  role?: string
}

const ASSIGNABLE = ['user', 'manager', 'admin']

const STATUS_BY_SQLSTATE: Record<string, number> = { '42501': 403, '22023': 400, P0002: 404 }

/** Change a user's role through update_user_role, which enforces admin-only access and protects the master admin. */
export default defineEventHandler(async (event) => {
  await requireUser(event)
  const body = await readBody<Body>(event)
  if (!body?.userId || !body.role || !ASSIGNABLE.includes(body.role)) {
    throw createError({ statusCode: 400, statusMessage: 'userId and a role of user, manager or admin are required' })
  }

  const client = await serverSupabaseClient<Database>(event)
  const { error } = await client.rpc('update_user_role', { target_user_id: body.userId, new_role: body.role })
  if (error) {
    throw createError({ statusCode: STATUS_BY_SQLSTATE[error.code] ?? 500, statusMessage: error.message })
  }
  return { success: true, userId: body.userId, role: body.role }
})
