import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id') ?? ''
  const { data, error } = await getServiceClient()
    .from('user_statuses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!data?.length) throw createError({ statusCode: 404, statusMessage: 'Status not found' })
  return { success: true }
})
