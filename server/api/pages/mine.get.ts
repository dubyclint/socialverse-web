import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { PAGE_CREATION_CAP } from '~/server/utils/pages'

/** Pages the caller can act as, with their role, plus their creation-cap usage. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const service = getServiceClient()
  const [{ data: roles, error }, { count }] = await Promise.all([
    service
      .from('page_admins')
      .select('role, page:pages(id,name,handle,avatar_url,category,followers_count)')
      .eq('user_id', user.id),
    service.from('pages').select('id', { count: 'exact', head: true }).eq('created_by_user_id', user.id)
  ])
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  const pages = (roles ?? [])
    .filter(row => row.page)
    .map(row => ({ ...row.page!, role: row.role }))
  return { pages, created_count: count ?? 0, cap: PAGE_CREATION_CAP }
})
