import { readBody } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { logStaffAction, requireStaff } from '~/server/utils/staff'
import { STAFF_PERMISSION_KEYS } from '~/utils/staff-permissions'

/** Admin-only: set which control sections a manager can use. */
export default defineEventHandler(async (event) => {
  const admin = await requireStaff(event, 'admin')
  const body = await readBody<{ userId?: string, permissions?: unknown }>(event)
  if (!body?.userId || !Array.isArray(body.permissions)) {
    throw createError({ statusCode: 400, statusMessage: 'userId and permissions[] are required' })
  }
  const permissions = [...new Set(body.permissions.filter((p): p is string => typeof p === 'string' && STAFF_PERMISSION_KEYS.includes(p)))]
  const service = getServiceClient()
  const { data: target } = await service.from('user').select('role').eq('user_id', body.userId).maybeSingle()
  if (!target) throw createError({ statusCode: 404, statusMessage: 'User not found' })
  if (target.role !== 'manager') throw createError({ statusCode: 400, statusMessage: 'Make this user a manager first' })
  const { error } = await service.from('user').update({ manager_permissions: permissions } as never).eq('user_id', body.userId)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  await logStaffAction(admin.id, 'set_manager_permissions', 'user', body.userId, { permissions })
  return { success: true, permissions }
})
