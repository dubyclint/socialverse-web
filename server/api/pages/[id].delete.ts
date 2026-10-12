import { requirePageRole } from '~/server/utils/actor'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadPage } from '~/server/utils/pages'

export default defineEventHandler(async (event) => {
  const page = await loadPage(getRouterParam(event, 'id') ?? '')
  await requirePageRole(event, page.id, ['OWNER'])
  const { error } = await getServiceClient().from('pages').delete().eq('id', page.id)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { success: true }
})
