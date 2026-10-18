import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireStaff } from '~/server/utils/staff'

/** Admin-only: managers and their granted sections. */
export default defineEventHandler(async (event) => {
  await requireStaff(event, 'admin')
  const { data, error } = await getServiceClient()
    .from('user')
    .select('user_id, username, display_name, avatar_url, manager_permissions')
    .eq('role', 'manager')
    .order('username')
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { managers: data ?? [] }
})
