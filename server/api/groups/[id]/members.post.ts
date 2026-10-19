import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { UUID_RE, displayNames, postGroupNotice, requireGroupAdmin } from '~/server/utils/group-chat'

const MAX_MEMBERS = 256

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { room } = await requireGroupAdmin(getRouterParam(event, 'id') ?? '', user.id)
  const body = await readBody<{ memberIds?: string[] }>(event)
  const requested = [...new Set((body?.memberIds ?? []).filter(id => UUID_RE.test(id)))]
  if (!requested.length) throw createError({ statusCode: 400, statusMessage: 'Choose at least one person' })

  const service = getServiceClient()
  const [{ data: existing }, { data: valid }] = await Promise.all([
    service.from('chat_room_members').select('user_id').eq('room_id', room.id),
    service.from('user').select('user_id, is_banned').in('user_id', requested)
  ])
  const current = new Set((existing ?? []).map(r => r.user_id))
  const toAdd = (valid ?? []).filter(u => !u.is_banned && !current.has(u.user_id)).map(u => u.user_id)
  if (!toAdd.length) throw createError({ statusCode: 400, statusMessage: 'Those people are already in the group' })
  if (current.size + toAdd.length > MAX_MEMBERS) throw createError({ statusCode: 400, statusMessage: `Groups are limited to ${MAX_MEMBERS} members` })

  const { error } = await service.from('chat_room_members').insert(toAdd.map(id => ({ room_id: room.id, user_id: id, member_role: 'member' })))
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  const names = await displayNames(toAdd)
  await postGroupNotice(room.id, user.id, `added ${toAdd.map(id => names.get(id) ?? 'someone').join(', ')}`)
  return { success: true, added: toAdd.length }
})
