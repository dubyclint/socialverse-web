import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'
import type { Chat, ChatMember } from '~/types/chat'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const client = await serverSupabaseClient<Database>(event)

  const { data: memberships, error: membershipError } = await client
    .from('chat_room_members')
    .select('room_id')
    .eq('user_id', user.id)

  if (membershipError) {
    throw createError({ statusCode: 500, statusMessage: membershipError.message })
  }

  const roomIds = (memberships || []).map(m => m.room_id)
  if (roomIds.length === 0) return { success: true, data: [] as Chat[] }

  const [{ data: rooms }, { data: messages }, { data: unread }, { data: memberRows }] = await Promise.all([
    client
      .from('chat_rooms')
      .select('id, room_name, room_avatar, is_group_chat, updated_at')
      .in('id', roomIds)
      .order('updated_at', { ascending: false }),
    client
      .from('chat_messages')
      .select('room_id, message_text, message_type, created_at')
      .in('room_id', roomIds)
      .order('created_at', { ascending: false }),
    client.rpc('chat_unread_counts'),
    client.from('chat_room_members').select('room_id, user_id').in('room_id', roomIds)
  ])

  const membersByRoom = new Map<string, string[]>()
  for (const row of memberRows ?? []) {
    membersByRoom.set(row.room_id, [...(membersByRoom.get(row.room_id) ?? []), row.user_id])
  }

  const peerIds = Array.from(new Set((memberRows ?? []).map(row => row.user_id).filter(id => id !== user.id)))
  const { data: people } = peerIds.length
    ? await client.from('user').select('user_id, username, display_name, avatar_url').in('user_id', peerIds)
    : { data: [] }
  const personById = new Map((people ?? []).map(person => [person.user_id, person]))

  const unreadByRoom = new Map((unread ?? []).map(row => [row.room_id, Number(row.unread)]))

  const latestByRoom = new Map<string, { message_text: string | null, message_type: string | null, created_at: string }>()
  for (const message of messages || []) {
    if (!latestByRoom.has(message.room_id)) latestByRoom.set(message.room_id, message)
  }

  const data: Chat[] = (rooms || []).map(room => {
    const latest = latestByRoom.get(room.id)
    const members = membersByRoom.get(room.id) ?? []
    const isGroup = room.is_group_chat ?? false
    // A direct chat is shown as the other person, never as the stored room name.
    const peer = isGroup ? undefined : personById.get(members.find(id => id !== user.id) ?? '')
    const name = isGroup
      ? room.room_name || 'Group'
      : peer?.display_name || peer?.username || 'Direct message'
    const preview = latest
      ? latest.message_text || (latest.message_type === 'audio' ? 'Voice message' : 'Attachment')
      : undefined

    return {
      id: room.id,
      name,
      title: name,
      avatar: (isGroup ? room.room_avatar : peer?.avatar_url) || undefined,
      type: isGroup ? 'group' as const : 'direct' as const,
      userId: peer?.user_id,
      username: peer?.username,
      participantCount: members.length,
      members: isGroup
        ? members.filter(id => id !== user.id).map((id): ChatMember => {
            const person = personById.get(id)
            return {
              userId: id,
              name: person?.display_name || person?.username || 'Member',
              avatar: person?.avatar_url || undefined
            }
          })
        : undefined,
      lastMessage: preview,
      lastMessageTime: latest ? new Date(latest.created_at).getTime() : undefined,
      unreadCount: unreadByRoom.get(room.id) ?? 0,
      isGroup
    }
  })

  return { success: true, data }
})
