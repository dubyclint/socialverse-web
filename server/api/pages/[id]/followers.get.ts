import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadPage } from '~/server/utils/pages'
import { DIRECTORY_COLUMNS, toDirectoryProfile } from '~/server/utils/social-graph'

/** People following a Page, newest first. */
export default defineEventHandler(async (event) => {
  const page = await loadPage(getRouterParam(event, 'id') ?? '')
  const service = getServiceClient()
  const { data: follows, error } = await service
    .from('page_follows')
    .select('user_id, created_at')
    .eq('page_id', page.id)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  const ids = (follows ?? []).map(row => row.user_id)
  if (!ids.length) return { data: [] }
  const { data: users, error: usersError } = await service
    .from('user')
    .select(DIRECTORY_COLUMNS)
    .in('user_id', ids)
    .eq('is_banned', false)
  if (usersError) throw createError({ statusCode: 500, statusMessage: usersError.message })
  const byId = new Map((users ?? []).map(row => [row.user_id, toDirectoryProfile(row)]))
  return { data: ids.map(id => byId.get(id)).filter(Boolean) }
})
