import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireStaff } from '~/server/utils/staff'

export default defineEventHandler(async (event) => {
  await requireStaff(event, 'announcements')
  const { data, error } = await getServiceClient().from('announcements' as never)
    .select('*').order('created_at', { ascending: false }).limit(50)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { announcements: data ?? [] }
})
