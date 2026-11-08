import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadPeople, loadVisibleStatus } from '~/server/utils/status-privacy'
import { ensureDirectRoom } from '~/server/utils/direct-room'
import { ensurePageRoom } from '~/server/utils/page-chat'
import { resolveActor } from '~/server/utils/actor'

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

  const actor = await resolveActor(event)
  const asPage = actor.type === 'PAGE' ? actor.id : null
  const isAuthor = status.page_id ? asPage === status.page_id : !asPage && status.user_id === user.id
  if (asPage && !isAuthor) throw createError({ statusCode: 403, statusMessage: 'Switch back to your personal profile to do this' })
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
  const pageName = status.page_id ? (await db.from('pages').select('name').eq('id', status.page_id).maybeSingle()).data?.name : null
  const actorName = (isAuthor && pageName) || me?.name || 'Someone'
  const snippet = content.length > 80 ? `${content.slice(0, 80)}…` : content
  const recipient = isAuthor ? root!.user_id : status.user_id
  if (recipient !== user.id) {
    await db.from('notifications').insert({
      recipient_id: recipient,
      recipient_page_id: !isAuthor && status.page_id ? status.page_id : null,
      notifier_id: user.id,
      event_type: isAuthor ? 'COMMENT_REPLY' : 'COMMENT_ADDED',
      source_id: status.id,
      message_text: isAuthor
        ? `${actorName} replied to your comment on their status: "${snippet}"`
        : `${actorName} commented on your status: "${snippet}"`,
      is_read: false
    } as never)
  }
  // Like WhatsApp, a status comment also lands in the private chat, quoting the status.
  let roomId: string | null = null
  if (recipient !== user.id) {
    roomId = status.page_id
      ? await ensurePageRoom(status.page_id, isAuthor ? recipient : user.id, user.id)
      : await ensureDirectRoom(db, user.id, recipient)
  }
  if (roomId) {
    const { data: st } = await db.from('user_statuses').select('content, caption, media_url').eq('id', status.id).maybeSingle()
    const text = (st?.content || st?.caption || '').replace(/\s+/g, ' ').trim()
    const media = st?.media_url ?? ''
    const preview = text ? (text.length > 60 ? `${text.slice(0, 60)}…` : text) : /\.(mp4|webm|mov)(\?|$)/i.test(media) ? '🎥 Video' : '📷 Photo'
    const { error: chatError } = await db.from('chat_messages').insert({
      room_id: roomId,
      sender_id: user.id,
      message_text: `↩️ Status: ${preview}\n${content}`,
      message_type: 'status_reply',
      metadata: { status_id: status.id, status_author_id: status.user_id }
    } as never)
    if (chatError) roomId = null
    else await db.from('chat_rooms').update({ updated_at: new Date().toISOString() }).eq('id', roomId)
  }
  return { success: true, data: { id: data.id, content, created_at: data.created_at, reply_to: root?.id ?? null, room_id: roomId } }
})
