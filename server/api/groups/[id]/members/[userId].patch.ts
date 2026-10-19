import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { UUID_RE, displayNames, ensureGroupAdmin, postGroupNotice, requireGroupAdmin } from '~/server/utils/group-chat'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { room } = await requireGroupAdmin(getRouterParam(event, 'id') ?? '', user.id)
  const targetId = getRouterParam(event, 'userId') ?? ''
  if (!UUID_RE.test(targetId)) throw createError({ statusCode: 400, statusMessage: 'Invalid member' })
  const body = await readBody<{ role?: string }>(event)
  const role = body?.role === 'admin' ? 'admin' : 'member'
  const { error, count } = await getServiceClient()
    .from('chat_room_members')
    .update({ member_role: role }, { count: 'exact' })
    .eq('room_id', room.id)
    .eq('user_id', targetId)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!count) throw createError({ statusCode: 404, statusMessage: 'That person is not in the group' })
  await ensureGroupAdmin(room.id)
  const names = await displayNames([targetId])
  await postGroupNotice(room.id, user.id, role === 'admin' ? `made ${names.get(targetId) ?? 'a member'} a group admin` : `dismissed ${names.get(targetId) ?? 'a member'} as admin`)
  return { success: true }
})
