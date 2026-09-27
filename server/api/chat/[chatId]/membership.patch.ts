import { createError, defineEventHandler, readBody, getRouterParam } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { getServiceClient } from '~/server/utils/supabase-admin'

interface MembershipPatch {
  muted?: boolean
  mutedMinutes?: number
  pinned?: boolean
  archived?: boolean
}

/** Per-member room preferences: mute, pin and archive. */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const chatId = getRouterParam(event, 'chatId')
  if (!chatId) throw createError({ statusCode: 400, statusMessage: 'Missing chat id' })

  const body = await readBody<MembershipPatch>(event)
  const service = getServiceClient()

  const { data: membership } = await service
    .from('chat_room_members')
    .select('id')
    .eq('room_id', chatId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) throw createError({ statusCode: 403, statusMessage: 'Not a member of this chat' })

  const patch: { muted_until?: string | null, is_pinned?: boolean, is_archived?: boolean } = {}
  if (typeof body.muted === 'boolean') {
    // An indefinite mute is stored far in the future so a single column can
    // express both timed and permanent mutes.
    patch.muted_until = body.muted
      ? new Date(Date.now() + (body.mutedMinutes ?? 60 * 24 * 365 * 10) * 60_000).toISOString()
      : null
  }
  if (typeof body.pinned === 'boolean') patch.is_pinned = body.pinned
  if (typeof body.archived === 'boolean') patch.is_archived = body.archived

  if (!Object.keys(patch).length) {
    throw createError({ statusCode: 400, statusMessage: 'Nothing to update' })
  }

  const { data, error } = await service
    .from('chat_room_members')
    .update(patch)
    .eq('id', membership.id)
    .select('muted_until, is_pinned, is_archived')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return {
    success: true,
    muted: Boolean(data.muted_until && new Date(data.muted_until) > new Date()),
    mutedUntil: data.muted_until,
    pinned: data.is_pinned,
    archived: data.is_archived
  }
})
