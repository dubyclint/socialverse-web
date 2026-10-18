import { getQuery } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireStaff } from '~/server/utils/staff'

/** Staff audit log, newest first. */
export default defineEventHandler(async (event) => {
  await requireStaff(event, 'security')
  const before = typeof getQuery(event).before === 'string' ? String(getQuery(event).before) : null
  const s = getServiceClient()
  let query = s.from('admin_actions').select('id, admin_id, action, target_type, target_id, details, created_at')
    .order('created_at', { ascending: false }).limit(100)
  if (before) query = query.lt('created_at', before)
  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  const ids = [...new Set((data ?? []).map(a => a.admin_id).filter((id): id is string => !!id))]
  const { data: staff } = ids.length ? await s.from('user').select('user_id, username, role').in('user_id', ids) : { data: [] }
  const byId = new Map((staff ?? []).map(u => [u.user_id, u]))
  const { data: admins } = await s.from('user').select('user_id, username, role, manager_permissions').in('role', ['admin', 'manager'])
  return {
    actions: (data ?? []).map(a => ({ ...a, staff: byId.get(a.admin_id ?? '') ?? null })),
    staff: admins ?? []
  }
})
