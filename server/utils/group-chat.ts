import { getServiceClient } from '~/server/utils/supabase-admin'

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface GroupAccess {
  room: { id: string, room_name: string | null, room_avatar: string | null, created_by: string | null, created_at: string | null }
  role: string
}

export const requireGroupMember = async (roomId: string, userId: string): Promise<GroupAccess> => {
  if (!UUID_RE.test(roomId)) throw createError({ statusCode: 400, statusMessage: 'Invalid group' })
  const service = getServiceClient()
  const [{ data: room }, { data: membership }] = await Promise.all([
    service.from('chat_rooms').select('id, room_name, room_avatar, created_by, created_at, is_group_chat').eq('id', roomId).maybeSingle(),
    service.from('chat_room_members').select('member_role').eq('room_id', roomId).eq('user_id', userId).maybeSingle()
  ])
  if (!room || !room.is_group_chat) throw createError({ statusCode: 404, statusMessage: 'Group not found' })
  if (!membership) throw createError({ statusCode: 403, statusMessage: 'You are not a member of this group' })
  return { room, role: membership.member_role ?? 'member' }
}

export const requireGroupAdmin = async (roomId: string, userId: string): Promise<GroupAccess> => {
  const access = await requireGroupMember(roomId, userId)
  if (access.role !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Only group admins can do that' })
  return access
}

export const postGroupNotice = async (roomId: string, actorId: string, text: string) => {
  const service = getServiceClient()
  await service.from('chat_messages').insert({ room_id: roomId, sender_id: actorId, message_text: text, message_type: 'system' })
  await service.from('chat_rooms').update({ last_message_at: new Date().toISOString() }).eq('id', roomId)
}

export const displayNames = async (ids: string[]): Promise<Map<string, string>> => {
  if (!ids.length) return new Map()
  const { data } = await getServiceClient().from('user').select('user_id, username, display_name').in('user_id', ids)
  return new Map((data ?? []).map(u => [u.user_id, u.display_name || u.username || 'Someone']))
}

/** Keeps at least one admin: if none remain, the longest-standing member is promoted. */
export const ensureGroupAdmin = async (roomId: string) => {
  const service = getServiceClient()
  const { count } = await service.from('chat_room_members').select('id', { count: 'exact', head: true }).eq('room_id', roomId).eq('member_role', 'admin')
  if (count) return
  const { data: next } = await service.from('chat_room_members').select('id').eq('room_id', roomId).order('joined_at', { ascending: true }).limit(1).maybeSingle()
  if (next) await service.from('chat_room_members').update({ member_role: 'admin' }).eq('id', next.id)
}
