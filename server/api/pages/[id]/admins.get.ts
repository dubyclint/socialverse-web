import { PAGE_ROLES, requirePageRole } from '~/server/utils/actor'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadPage } from '~/server/utils/pages'

export default defineEventHandler(async (event) => {
  const page = await loadPage(getRouterParam(event, 'id') ?? '')
  await requirePageRole(event, page.id, PAGE_ROLES)
  const { data, error } = await getServiceClient()
    .from('page_admins')
    .select('user_id, role, created_at, user:user(username, display_name, full_name, avatar_url)')
    .eq('page_id', page.id)
    .order('created_at')
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { admins: data ?? [] }
})
