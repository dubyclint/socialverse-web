import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'
import { assertAllowed } from '~/server/utils/staff'
import { enforceRateLimit } from '~/server/utils/rate-limit'
import { loadHostStreamPrefs } from '~/server/utils/stream-settings'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { broadcastToStream, liveUserCard } from '~/server/utils/stream-hub'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const streamId = event.context.params?.id
  if (!streamId) throw createError({ statusCode: 400, statusMessage: 'Stream ID is required' })

  await assertAllowed(user.id, 'chat')
  await enforceRateLimit(event, 'stream:chat', { limit: 20, windowMs: 30_000 }, user.id)
  const body = await readBody<{ content?: string }>(event)
  if (!body.content?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Message content is required' })
  }

  const { hostId, settings } = await loadHostStreamPrefs(streamId)
  if (!settings.allowComments && hostId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'The host has turned off chat for this stream' })
  }

  if (hostId !== user.id) {
    const { data: muted } = await getServiceClient().from('stream_mutes' as never).select('user_id').eq('stream_id', streamId).eq('user_id', user.id).maybeSingle()
    if (muted) throw createError({ statusCode: 403, statusMessage: 'The host muted you in this live' })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: message, error } = await supabase
    .from('stream_chats')
    .insert({ stream_id: streamId, user_id: user.id, message_text: body.content.trim().slice(0, 300) })
    .select('id, stream_id, user_id, message_text, is_pinned, created_at')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const withUser = { ...message, user: await liveUserCard(user.id) }
  broadcastToStream(streamId, { type: 'chat', message: withUser })
  return { success: true, data: withUser }
})
