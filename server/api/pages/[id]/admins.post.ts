import { PAGE_ROLES, requirePageRole, type PageRole } from '~/server/utils/actor'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadPage } from '~/server/utils/pages'
import { syncPageRoomMembers } from '~/server/utils/page-chat'

/** Owners add an admin by username, or change an existing admin's role. */
export default defineEventHandler(async (event) => {
  const page = await loadPage(getRouterParam(event, 'id') ?? '')
  const { userId } = await requirePageRole(event, page.id, ['OWNER'])
  const body = await readBody<{ username?: string, role?: string }>(event)
  const role = String(body?.role ?? '').toUpperCase() as PageRole
  if (!PAGE_ROLES.includes(role)) throw createError({ statusCode: 400, statusMessage: 'Role must be OWNER, MANAGER or MODERATOR' })
  const username = String(body?.username ?? '').trim().replace(/^@/, '').toLowerCase()
  if (!username) throw createError({ statusCode: 400, statusMessage: 'Username is required' })

  const service = getServiceClient()
  const { data: target } = await service.from('user').select('user_id').ilike('username', username).maybeSingle()
  if (!target) throw createError({ statusCode: 404, statusMessage: 'No user with that username' })

  if (target.user_id === userId && role !== 'OWNER') {
    const { count } = await service.from('page_admins').select('id', { count: 'exact', head: true }).eq('page_id', page.id).eq('role', 'OWNER')
    if ((count ?? 0) <= 1) throw createError({ statusCode: 409, statusMessage: 'Add another owner before stepping down' })
  }

  const { error } = await service
    .from('page_admins')
    .upsert({ page_id: page.id, user_id: target.user_id, role }, { onConflict: 'page_id,user_id' })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  await syncPageRoomMembers(page.id)
  return { success: true }
})
