import { requireRole } from '~/server/utils/rbac'
import { getServiceClient } from '~/server/utils/supabase-admin'

/** Staff roles + sellers, optionally looking up one user by username. */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'manager')
  const db = getServiceClient()
  const username = String(getQuery(event).username ?? '').trim().replace(/^@/, '')
  const [{ data: roles }, { data: sellers }] = await Promise.all([
    db.from('staff_roles' as never).select('*'),
    db.from('seller_profiles').select('*')
  ])
  const ids = [...new Set([...(roles ?? []).map((r: { user_id: string }) => r.user_id), ...(sellers ?? []).map(s => s.user_id)])]
  const { data: users } = ids.length ? await db.from('user').select('user_id, username, display_name, avatar_url, role').in('user_id', ids) : { data: [] }
  let found = null
  if (username) {
    const { data } = await db.from('user').select('user_id, username, display_name, avatar_url, role').ilike('username', username).maybeSingle()
    found = data
  }
  return { roles: roles ?? [], sellers: sellers ?? [], users: users ?? [], found }
})
