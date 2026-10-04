import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '~/server/utils/auth'

const ROLES = ['user', 'manager', 'admin', 'moderator'] as const

/** Users with their roles, for the admin role-management screen. The RPC rejects non-admins. */
export default defineEventHandler(async (event) => {
  await requireUser(event)
  const query = getQuery(event)
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const role = typeof query.role === 'string' && (ROLES as readonly string[]).includes(query.role) ? query.role : undefined
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200)
  const offset = Math.max(Number(query.offset) || 0, 0)

  const client = await serverSupabaseClient<Database>(event)
  const { data, error } = await client.rpc('admin_list_users', {
    p_search: search || undefined,
    p_role: role,
    p_limit: limit,
    p_offset: offset
  })
  if (error) {
    throw createError({ statusCode: error.code === '42501' ? 403 : 500, statusMessage: error.message })
  }

  const rows = data ?? []
  return {
    users: rows.map(({ total: _total, ...row }) => row),
    total: rows[0]?.total ?? 0
  }
})
