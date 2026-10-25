import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadVisibleStatus } from '~/server/utils/status-privacy'

/** Toggles the viewer's like on a status. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = getServiceClient()
  const status = await loadVisibleStatus(db, user.id, getRouterParam(event, 'id') ?? '')
  const { data: existing } = await db.from('status_likes').select('user_id').eq('status_id', status.id).eq('user_id', user.id).maybeSingle()
  const { error } = existing
    ? await db.from('status_likes').delete().eq('status_id', status.id).eq('user_id', user.id)
    : await db.from('status_likes').insert({ status_id: status.id, user_id: user.id })
  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not update like' })
  const { count } = await db.from('status_likes').select('user_id', { count: 'exact', head: true }).eq('status_id', status.id)
  return { success: true, data: { liked: !existing, count: count ?? 0 } }
})
