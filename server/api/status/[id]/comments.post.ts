import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadPeople, loadVisibleStatus } from '~/server/utils/status-privacy'

/**
 * Comments on a status, or replies within a thread. The author can reply to any
 * thread; a commenter can only add to their own thread.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = getServiceClient()
  const status = await loadVisibleStatus(db, user.id, getRouterParam(event, 'id') ?? '')
  const body = await readBody<{ content?: string, replyTo?: string }>(event)
  const content = String(body?.content ?? '').trim()
  if (!content || content.length > 500) throw createError({ statusCode: 400, statusMessage: 'Comments must be 1 to 500 characters' })

  const isAuthor = status.user_id === user.id
  let root: { id: string, user_id: string } | null = null
  if (body?.replyTo) {
    const { data } = await db.from('status_comments').select('id, user_id, reply_to').eq('id', body.replyTo).eq('status_id', status.id).maybeSingle()
    if (!data || data.reply_to) throw createError({ statusCode: 404, statusMessage: 'Comment not found' })
    if (!isAuthor && data.user_id !== user.id) throw createError({ statusCode: 403, statusMessage: 'You can only reply in your own thread' })
    root = data
  } else if (isAuthor) {
    throw createError({ statusCode: 400, statusMessage: 'Reply to a comment on your status' })
  }

  const { data, error } = await db.from('status_comments')
    .insert({ status_id: status.id, user_id: user.id, content, reply_to: root?.id ?? null })
    .select('id, created_at').single()
  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not post comment' })

  const me = (await loadPeople(db, [user.id])).get(user.id)
  const snippet = content.length > 80 ? `${content.slice(0, 80)}…` : content
  const recipient = isAuthor ? root!.user_id : status.user_id
  if (recipient !== user.id) {
    await db.from('notifications').insert({
      recipient_id: recipient,
      notifier_id: user.id,
      event_type: isAuthor ? 'COMMENT_REPLY' : 'COMMENT_ADDED',
      source_id: status.id,
      message_text: isAuthor
        ? `${me?.name ?? 'Someone'} replied to your comment on their status: "${snippet}"`
        : `${me?.name ?? 'Someone'} commented on your status: "${snippet}"`,
      is_read: false
    } as never)
  }
  return { success: true, data: { id: data.id, content, created_at: data.created_at, reply_to: root?.id ?? null } }
})
