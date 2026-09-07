import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'
import type { Chat } from '~/types/chat'

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

  const [{ data: rooms }, { data: messages }] = await Promise.all([
    client
      .from('chat_rooms')
      .select('id, room_name, room_avatar, is_group_chat, updated_at')
      .in('id', roomIds)
      .order('updated_at', { ascending: false }),
    client
      .from('chat_messages')
      .select('room_id, message_text, created_at')
      .in('room_id', roomIds)
      .order('created_at', { ascending: false })
  ])

  const latestByRoom = new Map<string, { message_text: string | null, created_at: string }>()
  for (const message of messages || []) {
    if (!latestByRoom.has(message.room_id)) latestByRoom.set(message.room_id, message)
  }

  const data: Chat[] = (rooms || []).map(room => {
    const latest = latestByRoom.get(room.id)
    return {
      id: room.id,
      name: room.room_name || 'Direct message',
      title: room.room_name || 'Direct message',
      avatar: room.room_avatar || undefined,
      lastMessage: latest?.message_text || undefined,
      lastMessageTime: latest ? new Date(latest.created_at).getTime() : undefined
    }
  })

  return { success: true, data }
})
