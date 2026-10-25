import { randomUUID } from 'node:crypto'
import { defineEventHandler, readBody, createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '~/server/utils/auth'
import { resolveActor } from '~/server/utils/actor'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { pageInboxUserIds, syncPageRoomMembers } from '~/server/utils/page-chat'

interface DirectChatBody {
  userId?: string
}

/**
 * Opens the one-to-one room with another user, reusing the existing room when
 * the pair already has one so a conversation never forks.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
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

  // Acting as a Page: the conversation belongs to the Page, so the other
  // person sees the Page (not the admin's personal profile) and every inbox
  // admin of the Page shares it.
  const actor = await resolveActor(event)
  if (actor.type === 'PAGE') {
    const service = getServiceClient()
    const { data: page } = await service.from('pages').select('id, name, avatar_url').eq('id', actor.id).maybeSingle()
    if (!page) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    const { data: existingPageRoom } = await service
      .from('chat_rooms')
      .select('id')
      .eq('page_id', page.id)
      .eq('page_visitor_id', otherId)
      .maybeSingle()
    if (existingPageRoom) {
      await syncPageRoomMembers(page.id)
      return { success: true, data: { id: existingPageRoom.id, existing: true } }
    }
    const admins = await pageInboxUserIds(page.id)
    if (admins.includes(otherId)) throw createError({ statusCode: 400, statusMessage: 'That person manages this Page' })
    const id = randomUUID()
    const { error } = await service.from('chat_rooms').insert({
      id,
      is_group_chat: false,
      room_name: page.name,
      room_avatar: page.avatar_url,
      created_by: user.id,
      page_id: page.id,
      page_visitor_id: otherId
    })
    if (error) {
      if (error.code === '23505') {
        const { data: raced } = await service.from('chat_rooms').select('id').eq('page_id', page.id).eq('page_visitor_id', otherId).single()
        return { success: true, data: { id: raced?.id, existing: true } }
      }
      throw createError({ statusCode: 500, statusMessage: error.message })
    }
    const memberIds = [...new Set([otherId, user.id, ...admins])]
    const { error: memberError } = await service
      .from('chat_room_members')
      .insert(memberIds.map(user_id => ({ room_id: id, user_id })))
    if (memberError) {
      await service.from('chat_rooms').delete().eq('id', id)
      throw createError({ statusCode: 500, statusMessage: memberError.message })
    }
    return { success: true, data: { id, existing: false } }
  }

  const { data: mine } = await client
    .from('chat_room_members')
    .select('room_id, chat_rooms!inner(is_group_chat, page_id)')
    .eq('user_id', user.id)
    .eq('chat_rooms.is_group_chat', false)
    .is('chat_rooms.page_id', null)

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

  // The id is generated here because the creator cannot read the room back
  // (RETURNING) until their membership row exists.
  const room = { id: randomUUID() }
  const { error: roomError } = await client
    .from('chat_rooms')
    .insert({
      id: room.id,
      is_group_chat: false,
      room_name: counterparty.display_name || counterparty.username,
      created_by: user.id
    })

  if (roomError) {
    throw createError({ statusCode: 500, statusMessage: roomError.message })
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
