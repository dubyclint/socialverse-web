import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '~/server/utils/auth'

interface CreateGroupBody {
  name?: string
  avatar?: string | null
  memberIds?: string[]
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const body = await readBody<CreateGroupBody>(event)
  const name = body?.name?.trim() ?? ''
  const memberIds = [...new Set((body?.memberIds ?? []).filter(id => UUID_RE.test(id)))]

  if (!name) throw createError({ statusCode: 400, statusMessage: 'Group name is required' })
  if (!memberIds.length) throw createError({ statusCode: 400, statusMessage: 'Add at least one member' })

  const client = await serverSupabaseClient<Database>(event)
  const { data: roomId, error } = await client.rpc('create_group_chat', {
    p_name: name,
    p_avatar: body?.avatar ?? '',
    p_members: memberIds
  })
  if (error || !roomId) {
    throw createError({ statusCode: error?.code === '22023' ? 400 : 500, statusMessage: error?.message || 'Failed to create group' })
  }

  return {
    success: true,
    data: { id: roomId, name, title: name, isGroup: true, lastMessageTime: Date.now(), unreadCount: 0 }
  }
})
