import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { UUID_RE, displayNames, ensureGroupAdmin, postGroupNotice, requireGroupAdmin, requireGroupMember } from '~/server/utils/group-chat'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const roomId = getRouterParam(event, 'id') ?? ''
  const targetId = getRouterParam(event, 'userId') ?? ''
  if (!UUID_RE.test(targetId)) throw createError({ statusCode: 400, statusMessage: 'Invalid member' })
  const leaving = targetId === user.id
  const { room } = leaving ? await requireGroupMember(roomId, user.id) : await requireGroupAdmin(roomId, user.id)

  const service = getServiceClient()
  const names = await displayNames([targetId])
  if (leaving) await postGroupNotice(room.id, user.id, 'left the group')
  const { error, count } = await service.from('chat_room_members').delete({ count: 'exact' }).eq('room_id', room.id).eq('user_id', targetId)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!count) throw createError({ statusCode: 404, statusMessage: 'That person is not in the group' })
  if (!leaving) await postGroupNotice(room.id, user.id, `removed ${names.get(targetId) ?? 'a member'}`)
  await ensureGroupAdmin(room.id)
  return { success: true }
})
