import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { postGroupNotice, requireGroupAdmin } from '~/server/utils/group-chat'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { room } = await requireGroupAdmin(getRouterParam(event, 'id') ?? '', user.id)
  const body = await readBody<{ name?: string, avatar?: string | null }>(event)
  const patch: { room_name?: string, room_avatar?: string | null, updated_at: string } = { updated_at: new Date().toISOString() }
  if (body?.name !== undefined) {
    const name = String(body.name).trim()
    if (name.length < 1 || name.length > 80) throw createError({ statusCode: 400, statusMessage: 'Group name must be 1-80 characters' })
    patch.room_name = name
  }
  if (body?.avatar !== undefined) {
    const avatar = body.avatar ? String(body.avatar) : null
    if (avatar && !/^https:\/\//.test(avatar)) throw createError({ statusCode: 400, statusMessage: 'Invalid photo' })
    patch.room_avatar = avatar
  }
  const { error } = await getServiceClient().from('chat_rooms').update(patch).eq('id', room.id)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (patch.room_name && patch.room_name !== room.room_name) await postGroupNotice(room.id, user.id, `changed the group name to "${patch.room_name}"`)
  if (body?.avatar !== undefined) await postGroupNotice(room.id, user.id, patch.room_avatar ? 'changed the group photo' : 'removed the group photo')
  return { success: true }
})
