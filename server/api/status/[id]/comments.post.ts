import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadVisibleStatus } from '~/server/utils/status-privacy'

/** Replies to a status. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = getServiceClient()
  const status = await loadVisibleStatus(db, user.id, getRouterParam(event, 'id') ?? '')
  const content = String((await readBody<{ content?: string }>(event))?.content ?? '').trim()
  if (!content || content.length > 500) throw createError({ statusCode: 400, statusMessage: 'Comments must be 1 to 500 characters' })
  const { data, error } = await db.from('status_comments').insert({ status_id: status.id, user_id: user.id, content }).select('id, created_at').single()
  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not post comment' })
  return { success: true, data: { id: data.id, content, created_at: data.created_at } }
})
