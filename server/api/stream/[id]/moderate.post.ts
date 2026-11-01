import { readBody } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadStaff } from '~/server/utils/staff'
import { broadcastToStream } from '~/server/utils/stream-hub'

type Action = 'pin' | 'unpin' | 'delete' | 'mute' | 'unmute'

/** Host (or admin) moderation inside a live: pin/unpin/delete comments, mute/unmute viewers. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const streamId = getRouterParam(event, 'id')
  const body = await readBody<{ action?: Action, messageId?: string, userId?: string }>(event)
  if (!streamId || !body?.action) throw createError({ statusCode: 400, statusMessage: 'Missing action' })
  const db = getServiceClient()
  const { data: stream } = await db.from('streams').select('creator_id').eq('id', streamId).maybeSingle()
  if (!stream) throw createError({ statusCode: 404, statusMessage: 'Stream not found' })
  if (stream.creator_id !== user.id && (await loadStaff(user.id))?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Only the host can moderate this live' })
  }
  const { action, messageId, userId } = body
  if (['pin', 'unpin', 'delete'].includes(action)) {
    if (!messageId) throw createError({ statusCode: 400, statusMessage: 'messageId required' })
    if (action === 'delete') {
      await db.from('stream_chats').delete().eq('id', messageId).eq('stream_id', streamId)
    } else {
      if (action === 'pin') await db.from('stream_chats').update({ is_pinned: false }).eq('stream_id', streamId).eq('is_pinned', true)
      await db.from('stream_chats').update({ is_pinned: action === 'pin' }).eq('id', messageId).eq('stream_id', streamId)
    }
  } else if (action === 'mute' || action === 'unmute') {
    if (!userId || userId === stream.creator_id) throw createError({ statusCode: 400, statusMessage: 'Pick a viewer to mute' })
    if (action === 'mute') await db.from('stream_mutes' as never).upsert({ stream_id: streamId, user_id: userId, muted_by: user.id } as never)
    else await db.from('stream_mutes' as never).delete().eq('stream_id', streamId).eq('user_id', userId)
  } else {
    throw createError({ statusCode: 400, statusMessage: 'Unknown action' })
  }
  broadcastToStream(streamId, { type: 'moderation', action, messageId: messageId ?? null, userId: userId ?? null })
  return { success: true }
})
