import { defineEventHandler, readBody, createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

interface DirectChatBody {
  userId?: string
}

/**
 * Opens the one-to-one room with another user, reusing the existing room when
 * the pair already has one so a conversation never forks.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody<DirectChatBody>(event)
  const otherId = body?.userId?.trim()
  if (!otherId) throw createError({ statusCode: 400, statusMessage: 'userId is required' })
  if (otherId === user.id) throw createError({ statusCode: 400, statusMessage: 'Cannot chat with yourself' })

  const client = await serverSupabaseClient<Database>(event)

  const { data: counterparty } = await client
    .from('user')
    .select('user_id, username, display_name, avatar_url')
    .eq('user_id', otherId)
    .maybeSingle()

  if (!counterparty) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  const { data: mine } = await client
    .from('chat_room_members')
    .select('room_id, chat_rooms!inner(is_group_chat)')
    .eq('user_id', user.id)
    .eq('chat_rooms.is_group_chat', false)

  const candidateIds = (mine ?? []).map(row => row.room_id)

  if (candidateIds.length) {
    const { data: shared } = await client
      .from('chat_room_members')
      .select('room_id')
      .eq('user_id', otherId)
      .in('room_id', candidateIds)
      .limit(1)

    const existing = shared?.[0]
    if (existing) {
      return { success: true, data: { id: existing.room_id, existing: true } }
    }
  }

  const { data: room, error: roomError } = await client
    .from('chat_rooms')
    .insert({
      is_group_chat: false,
      room_name: counterparty.display_name || counterparty.username,
      created_by: user.id
    })
    .select('id')
    .single()

  if (roomError || !room) {
    throw createError({ statusCode: 500, statusMessage: roomError?.message || 'Failed to create chat' })
  }

  // Inserted separately: the policy for adding somebody else requires the
  // caller's own membership row to already be visible.
  const { error: selfError } = await client
    .from('chat_room_members')
    .insert({ room_id: room.id, user_id: user.id })

  if (selfError) throw createError({ statusCode: 500, statusMessage: selfError.message })

  const { error: memberError } = await client
    .from('chat_room_members')
    .insert({ room_id: room.id, user_id: otherId })

  if (memberError) throw createError({ statusCode: 500, statusMessage: memberError.message })

  return { success: true, data: { id: room.id, existing: false } }
})
