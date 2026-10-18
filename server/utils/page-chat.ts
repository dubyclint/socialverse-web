import { getServiceClient } from '~/server/utils/supabase-admin'

/** Roles that read and answer a Page's inbox. */
export const PAGE_INBOX_ROLES = ['OWNER', 'MANAGER'] as const

export interface PageIdentity { id: string, name: string, handle: string, avatar_url: string | null, is_verified: boolean | null, verified_type: string | null }

export const pageInboxUserIds = async (pageId: string): Promise<string[]> => {
  const { data } = await getServiceClient()
    .from('page_admins')
    .select('user_id')
    .eq('page_id', pageId)
    .in('role', [...PAGE_INBOX_ROLES])
  return (data ?? []).map(row => row.user_id)
}

/** Keeps every Page conversation's members equal to the visitor plus the Page's current inbox admins. */
export const syncPageRoomMembers = async (pageId: string): Promise<void> => {
  const service = getServiceClient()
  const [admins, { data: rooms }] = await Promise.all([
    pageInboxUserIds(pageId),
    service.from('chat_rooms').select('id, page_visitor_id').eq('page_id', pageId)
  ])
  for (const room of rooms ?? []) {
    const wanted = new Set([...admins, room.page_visitor_id].filter((id): id is string => Boolean(id)))
    const { data: members } = await service.from('chat_room_members').select('user_id').eq('room_id', room.id)
    const current = new Set((members ?? []).map(m => m.user_id))
    const add = [...wanted].filter(id => !current.has(id)).map(user_id => ({ room_id: room.id, user_id }))
    const remove = [...current].filter(id => !wanted.has(id))
    if (add.length) await service.from('chat_room_members').insert(add)
    if (remove.length) await service.from('chat_room_members').delete().eq('room_id', room.id).in('user_id', remove)
  }
}

/** Page identity per room for Page conversations, keyed by room id. */
export const pageRoomsById = async (roomIds: string[]) => {
  const result = new Map<string, { page: PageIdentity, visitorId: string | null }>()
  if (!roomIds.length) return result
  const service = getServiceClient()
  const { data: rooms } = await service
    .from('chat_rooms')
    .select('id, page_id, page_visitor_id')
    .in('id', roomIds)
    .not('page_id', 'is', null)
  const pageIds = [...new Set((rooms ?? []).map(r => r.page_id as string))]
  if (!pageIds.length) return result
  const { data: pages } = await service.from('pages').select('id, name, handle, avatar_url, is_verified, verified_type').in('id', pageIds)
  const pageById = new Map((pages ?? []).map(p => [p.id, p]))
  for (const room of rooms ?? []) {
    const page = pageById.get(room.page_id as string)
    if (page) result.set(room.id, { page, visitorId: room.page_visitor_id })
  }
  return result
}

/** In a Page conversation, anyone other than the visitor speaks as the Page. */
export const pageSenderOverride = (
  room: { page: PageIdentity, visitorId: string | null } | undefined,
  senderId: string
): { senderName: string, senderAvatar: string | undefined, senderPageId: string, senderVerified: boolean, senderVerifiedType: string | null } | null => {
  if (!room || senderId === room.visitorId) return null
  return { senderName: room.page.name, senderAvatar: room.page.avatar_url || undefined, senderPageId: room.page.id, senderVerified: room.page.is_verified === true, senderVerifiedType: room.page.verified_type }
}
