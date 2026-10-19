import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireGroupMember } from '~/server/utils/group-chat'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { room, role } = await requireGroupMember(getRouterParam(event, 'id') ?? '', user.id)
  const service = getServiceClient()
  const { data: rows } = await service
    .from('chat_room_members')
    .select('user_id, member_role, joined_at')
    .eq('room_id', room.id)
    .order('joined_at', { ascending: true })
  const ids = (rows ?? []).map(r => r.user_id).filter((id): id is string => Boolean(id))
  const { data: people } = ids.length
    ? await service.from('user').select('user_id, username, display_name, avatar_url, is_verified, verified_type').in('user_id', ids)
    : { data: [] }
  const byId = new Map((people ?? []).map(p => [p.user_id, p]))
  const members = (rows ?? []).map((r) => {
    const p = r.user_id ? byId.get(r.user_id) : undefined
    return {
      userId: r.user_id,
      username: p?.username ?? null,
      name: p?.display_name || p?.username || 'Member',
      avatar: p?.avatar_url ?? null,
      isVerified: p?.is_verified === true,
      verifiedType: p?.verified_type ?? null,
      role: r.member_role ?? 'member',
      joinedAt: r.joined_at
    }
  }).sort((a, b) => Number(b.role === 'admin') - Number(a.role === 'admin'))

  return {
    data: {
      id: room.id,
      name: room.room_name || 'Group',
      avatar: room.room_avatar,
      createdBy: room.created_by,
      createdAt: room.created_at,
      myRole: role,
      memberCount: members.length,
      members
    }
  }
})
