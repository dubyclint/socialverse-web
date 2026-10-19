import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { PAGE_CREATION_CAP } from '~/server/utils/pages'

/** Pages the caller can act as, with their role, plus their creation-cap usage. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const service = getServiceClient()
  const cols = 'id,name,handle,avatar_url,cover_url,bio,category,followers_count,posts_count,is_verified,verified_type'
  const [{ data: roles, error }, { count }, { data: follows }] = await Promise.all([
    service
      .from('page_admins')
      .select(`role, page:pages(${cols})`)
      .eq('user_id', user.id),
    service.from('pages').select('id', { count: 'exact', head: true }).eq('created_by_user_id', user.id),
    service
      .from('page_follows')
      .select(`page:pages(${cols})`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
  ])
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  const pages = (roles ?? [])
    .filter(row => row.page)
    .map(row => ({ ...row.page!, role: row.role }))
  const followed = (follows ?? []).map(row => row.page).filter((page): page is NonNullable<typeof page> => Boolean(page))
  return { pages, followed, created_count: count ?? 0, cap: PAGE_CREATION_CAP }
})
