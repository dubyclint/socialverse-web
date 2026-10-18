import { randomUUID } from 'node:crypto'
import { requireUser } from '~/server/utils/auth'
import { getPageRole } from '~/server/utils/actor'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadPage } from '~/server/utils/pages'
import { pageInboxUserIds, syncPageRoomMembers } from '~/server/utils/page-chat'

/** Opens (or reuses) the visitor's conversation with a Page. The Page's owners and managers answer as the Page. */
export default defineEventHandler(async (event) => {
  const page = await loadPage(getRouterParam(event, 'id') ?? '')
  const user = await requireUser(event)
  if (await getPageRole(page.id, user.id)) {
    throw createError({ statusCode: 400, statusMessage: 'You manage this Page — its messages are in your chat inbox' })
  }

  const service = getServiceClient()
  const { data: existing } = await service
    .from('chat_rooms')
    .select('id')
    .eq('page_id', page.id)
    .eq('page_visitor_id', user.id)
    .maybeSingle()
  if (existing) {
    await syncPageRoomMembers(page.id)
    return { success: true, data: { id: existing.id, existing: true } }
  }

  const admins = await pageInboxUserIds(page.id)
  if (!admins.length) throw createError({ statusCode: 409, statusMessage: 'This Page has no one to answer messages yet' })

  const id = randomUUID()
  const { error } = await service.from('chat_rooms').insert({
    id,
    is_group_chat: false,
    room_name: page.name,
    room_avatar: page.avatar_url,
    created_by: user.id,
    page_id: page.id,
    page_visitor_id: user.id
  })
  if (error) {
    if (error.code === '23505') {
      const { data: raced } = await service.from('chat_rooms').select('id').eq('page_id', page.id).eq('page_visitor_id', user.id).single()
      return { success: true, data: { id: raced?.id, existing: true } }
    }
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  const { error: memberError } = await service
    .from('chat_room_members')
    .insert([user.id, ...admins].map(user_id => ({ room_id: id, user_id })))
  if (memberError) {
    await service.from('chat_rooms').delete().eq('id', id)
    throw createError({ statusCode: 500, statusMessage: memberError.message })
  }
  return { success: true, data: { id, existing: false } }
})
