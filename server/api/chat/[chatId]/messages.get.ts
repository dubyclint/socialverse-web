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

  const { data: members } = await client
    .from('chat_room_members')
    .select('user_id, last_delivered_at, last_read_at')
    .eq('room_id', chatId)

  const membership = (members || []).find(member => member.user_id === user.id)
  if (!membership) throw createError({ statusCode: 403, statusMessage: 'Not a member of this chat' })

  // A message counts as delivered/read once every other member's watermark
  // has passed it.
  const others = (members || []).filter(member => member.user_id !== user.id)
  const watermark = (column: 'last_delivered_at' | 'last_read_at'): number => {
    if (!others.length) return 0
    let earliest = Infinity
    for (const member of others) {
      const value = column === 'last_delivered_at' ? member.last_delivered_at : member.last_read_at
      if (!value) return 0
      earliest = Math.min(earliest, new Date(value).getTime())
    }
    return earliest
  }

  const deliveredUpTo = watermark('last_delivered_at')
  const readUpTo = watermark('last_read_at')

  const { data: rows, error } = await client
    .from('chat_messages')
    .select('id, sender_id, message_text, created_at, room_id')
    .eq('room_id', chatId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const senderIds = Array.from(new Set((rows || []).map(row => row.sender_id)))
  const { data: senders } = senderIds.length
    ? await client.from('user').select('user_id, username, display_name, avatar_url').in('user_id', senderIds)
    : { data: [] }

  const senderById = new Map((senders || []).map(sender => [sender.user_id, sender]))

  const data: ChatMessage[] = (rows || []).reverse().map(row => {
    const sender = senderById.get(row.sender_id)
    const timestamp = new Date(row.created_at).getTime()
    const own = row.sender_id === user.id

    return {
      id: row.id,
      chatId: row.room_id,
      senderId: row.sender_id,
      senderName: sender?.display_name || sender?.username || 'unknown',
      senderAvatar: sender?.avatar_url || undefined,
      content: row.message_text || '',
      messageType: 'text' as const,
      timestamp,
      status: !own
        ? undefined
        : timestamp <= readUpTo
          ? ('read' as const)
          : timestamp <= deliveredUpTo
            ? ('delivered' as const)
            : ('sent' as const)
    }
  })

  return { success: true, data }
})
