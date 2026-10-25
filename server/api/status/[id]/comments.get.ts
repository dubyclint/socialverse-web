import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadPeople, loadVisibleStatus } from '~/server/utils/status-privacy'

/**
 * Status comment threads. The author sees every thread; anyone else sees only
 * their own thread (their comments and the author's replies to them).
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = getServiceClient()
  const status = await loadVisibleStatus(db, user.id, getRouterParam(event, 'id') ?? '')
  const { data, error } = await db.from('status_comments').select('id, user_id, content, created_at, reply_to')
    .eq('status_id', status.id).order('created_at', { ascending: true }).limit(500)
  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not load comments' })
  const isAuthor = status.user_id === user.id
  const roots = (data ?? []).filter(c => !c.reply_to && (isAuthor || c.user_id === user.id))
  const rootIds = new Set(roots.map(r => r.id))
  const visible = (data ?? []).filter(c => rootIds.has(c.id) || (c.reply_to && rootIds.has(c.reply_to)))
  const people = await loadPeople(db, visible.map(c => c.user_id))
  return {
    success: true,
    data: {
      is_author: isAuthor,
      threads: roots.map(r => ({
        id: r.id,
        content: r.content,
        created_at: r.created_at,
        user: people.get(r.user_id) ?? null,
        replies: visible.filter(c => c.reply_to === r.id).map(c => ({
          id: c.id, content: c.content, created_at: c.created_at, user: people.get(c.user_id) ?? null, by_author: c.user_id === status.user_id
        }))
      }))
    }
  }
})
