import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'
import type { ChatMessage } from '~/types/chat'

const PAGE_SIZE = 50

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const chatId = getRouterParam(event, 'chatId')
  if (!chatId) throw createError({ statusCode: 400, statusMessage: 'Missing chat id' })

  const client = await serverSupabaseClient<Database>(event)

  const { data: membership } = await client
    .from('chat_room_members')
    .select('room_id')
    .eq('room_id', chatId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) throw createError({ statusCode: 403, statusMessage: 'Not a member of this chat' })

  const { data: rows, error } = await client
    .from('chat_messages')
    .select('id, sender_id, message_text, created_at, room_id')
    .eq('room_id', chatId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const senderIds = Array.from(new Set((rows || []).map(row => row.sender_id)))
  const { data: senders } = senderIds.length
    ? await client.from('user').select('user_id, username, avatar_url').in('user_id', senderIds)
    : { data: [] }

  const senderById = new Map((senders || []).map(sender => [sender.user_id, sender]))

  const data: ChatMessage[] = (rows || []).reverse().map(row => {
    const sender = senderById.get(row.sender_id)
    return {
      id: row.id,
      userId: row.sender_id,
      username: sender?.username || 'unknown',
      avatar: sender?.avatar_url || undefined,
      message: row.message_text || '',
      timestamp: new Date(row.created_at).getTime(),
      roomId: row.room_id,
      chatId: row.room_id
    }
  })

  return { success: true, data }
})
