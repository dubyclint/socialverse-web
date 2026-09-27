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
    .select(
      'id, sender_id, message_text, created_at, room_id, attachment_urls, message_type, reply_to_id, edited_at, deleted_at, deleted_for_everyone, expires_at'
    )
    .eq('room_id', chatId)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const visible = (rows || []).filter(row => !row.deleted_at || !row.deleted_for_everyone)

  const senderIds = Array.from(new Set(visible.map(row => row.sender_id)))
  const { data: senders } = senderIds.length
    ? await client.from('user').select('user_id, username, display_name, avatar_url').in('user_id', senderIds)
    : { data: [] }

  const senderById = new Map((senders || []).map(sender => [sender.user_id, sender]))

  const messageIds = visible.map(row => row.id)
  const { data: reactionRows } = messageIds.length
    ? await client
      .from('chat_message_reactions')
      .select('message_id, user_id, emoji_code')
      .in('message_id', messageIds)
    : { data: [] }

  const reactionsByMessage = new Map<string, { emoji: string; count: number; reacted: boolean }[]>()
  for (const reaction of reactionRows || []) {
    const list = reactionsByMessage.get(reaction.message_id) ?? []
    const entry = list.find(item => item.emoji === reaction.emoji_code)
    if (entry) {
      entry.count += 1
      entry.reacted = entry.reacted || reaction.user_id === user.id
    } else {
      list.push({ emoji: reaction.emoji_code, count: 1, reacted: reaction.user_id === user.id })
    }
    reactionsByMessage.set(reaction.message_id, list)
  }

  // Quoted messages may be older than this page, so they are fetched by id.
  const replyIds = Array.from(
    new Set(visible.map(row => row.reply_to_id).filter((id): id is string => Boolean(id)))
  )
  const { data: replyRows } = replyIds.length
    ? await client
      .from('chat_messages')
      .select('id, sender_id, message_text')
      .in('id', replyIds)
    : { data: [] }

  const replyById = new Map((replyRows || []).map(row => [row.id, row]))

  const data: ChatMessage[] = visible.reverse().map((row) => {
    const sender = senderById.get(row.sender_id)
    const timestamp = new Date(row.created_at).getTime()
    const own = row.sender_id === user.id
    const quoted = row.reply_to_id ? replyById.get(row.reply_to_id) : undefined

    return {
      id: row.id,
      chatId: row.room_id,
      senderId: row.sender_id,
      senderName: sender?.display_name || sender?.username || 'unknown',
      senderAvatar: sender?.avatar_url || undefined,
      content: row.deleted_at ? '' : row.message_text || '',
      attachments: row.deleted_at ? [] : row.attachment_urls ?? [],
      messageType: (row.message_type || 'text') as ChatMessage['messageType'],
      replyTo: quoted
        ? {
            id: quoted.id,
            senderId: quoted.sender_id,
            content: quoted.message_text || ''
          }
        : undefined,
      reactions: reactionsByMessage.get(row.id) ?? [],
      editedAt: row.edited_at ?? undefined,
      deleted: Boolean(row.deleted_at),
      expiresAt: row.expires_at ?? undefined,
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
