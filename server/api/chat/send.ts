import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

/** Direct message send: resolves (or opens) the 1:1 room, then appends the message. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { recipientId, message } = await readBody<{ recipientId?: string, message?: string }>(event)

  if (!recipientId || !message?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'recipientId and message are required' })
  }

  const client = await serverSupabaseClient<Database>(event)

  const [{ data: mine }, { data: theirs }] = await Promise.all([
    client.from('chat_room_members').select('room_id').eq('user_id', user.id),
    client.from('chat_room_members').select('room_id').eq('user_id', recipientId)
  ])

  const theirRooms = new Set((theirs || []).map(row => row.room_id))
  const sharedRoomIds = (mine || []).map(row => row.room_id).filter(id => theirRooms.has(id))

  let roomId: string | null = null

  if (sharedRoomIds.length) {
    const { data: directRooms } = await client
      .from('chat_rooms')
      .select('id')
      .in('id', sharedRoomIds)
      .eq('is_group_chat', false)
      .limit(1)

    roomId = directRooms?.[0]?.id ?? null
  }

  if (!roomId) {
    const { data: room, error: roomError } = await client
      .from('chat_rooms')
      .insert({ is_group_chat: false, created_by: user.id })
      .select('id')
      .single()

    if (roomError || !room) {
      throw createError({ statusCode: 500, statusMessage: roomError?.message || 'Failed to open chat' })
    }

    roomId = room.id

    const { error: memberError } = await client
      .from('chat_room_members')
      .insert([
        { room_id: roomId, user_id: user.id },
        { room_id: roomId, user_id: recipientId }
      ])

    if (memberError) throw createError({ statusCode: 500, statusMessage: memberError.message })
  }

  const { data: inserted, error: messageError } = await client
    .from('chat_messages')
    .insert({ room_id: roomId, sender_id: user.id, message_text: message })
    .select('id, created_at')
    .single()

  if (messageError) throw createError({ statusCode: 500, statusMessage: messageError.message })

  await client.from('chat_rooms').update({ updated_at: new Date().toISOString() }).eq('id', roomId)

  return { success: true, data: { roomId, messageId: inserted?.id, createdAt: inserted?.created_at } }
})
