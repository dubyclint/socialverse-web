import { requireUser } from '~/server/utils/auth'
import { getPageRole } from '~/server/utils/actor'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadPage } from '~/server/utils/pages'

/** Owners remove admins; any admin may remove themself. The last owner cannot leave. */
export default defineEventHandler(async (event) => {
  const page = await loadPage(getRouterParam(event, 'id') ?? '')
  const targetId = getRouterParam(event, 'userId') ?? ''
  const user = await requireUser(event)
  const callerRole = await getPageRole(page.id, user.id)
  if (callerRole !== 'OWNER' && targetId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Only owners can remove admins' })
  }

  const service = getServiceClient()
  const targetRole = await getPageRole(page.id, targetId)
  if (!targetRole) throw createError({ statusCode: 404, statusMessage: 'Not an admin of this Page' })
  if (targetRole === 'OWNER') {
    const { count } = await service.from('page_admins').select('id', { count: 'exact', head: true }).eq('page_id', page.id).eq('role', 'OWNER')
    if ((count ?? 0) <= 1) throw createError({ statusCode: 409, statusMessage: 'A Page needs at least one owner. Transfer ownership or delete the Page.' })
  }

  const { error } = await service.from('page_admins').delete().eq('page_id', page.id).eq('user_id', targetId)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { success: true }
})
