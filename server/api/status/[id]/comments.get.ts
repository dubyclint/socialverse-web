import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadPeople, loadVisibleStatus } from '~/server/utils/status-privacy'

/** Status replies: the author sees all of them, everyone else only their own. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = getServiceClient()
  const status = await loadVisibleStatus(db, user.id, getRouterParam(event, 'id') ?? '')
  let query = db.from('status_comments').select('id, user_id, content, created_at').eq('status_id', status.id)
  if (status.user_id !== user.id) query = query.eq('user_id', user.id)
  const { data, error } = await query.order('created_at', { ascending: true }).limit(200)
  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not load comments' })
  const people = await loadPeople(db, (data ?? []).map(c => c.user_id))
  return { success: true, data: (data ?? []).map(c => ({ id: c.id, content: c.content, created_at: c.created_at, user: people.get(c.user_id) ?? null })) }
})
