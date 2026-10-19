import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireStaff } from '~/server/utils/staff'

export default defineEventHandler(async (event) => {
  await requireStaff(event, 'compliance')
  const { data, error } = await getServiceClient().from('live_access_rules' as never).select('*').eq('id', true).single()
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { rules: data }
})
