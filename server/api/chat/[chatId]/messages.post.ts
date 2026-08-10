import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { requireUuid, sanitizeText } from '~/server/utils/input'
import { enforceRateLimit } from '~/server/utils/rate-limit'
import type { Database } from '~/types/database.types'

/** Post into an existing room the caller belongs to (used by trade chat). */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const chatId = getRouterParam(event, 'chatId')
  const { message } = await readBody<{ message?: string }>(event)

  const roomId = requireUuid(chatId, 'chat id')
  const text = sanitizeText(message, 'message', 2000)

  await enforceRateLimit(event, 'chat:message', { limit: 30, windowMs: 60_000 }, user.id)

  const client = await serverSupabaseClient<Database>(event)

  const { data: membership } = await client
    .from('chat_room_members')
    .select('room_id')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) throw createError({ statusCode: 403, statusMessage: 'Not a member of this chat' })

  const { data: inserted, error } = await client
    .from('chat_messages')
    .insert({ room_id: roomId, sender_id: user.id, message_text: text })
    .select('id, created_at')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  await client.from('chat_rooms').update({ updated_at: new Date().toISOString() }).eq('id', roomId)

  return { success: true, data: { roomId, messageId: inserted.id, createdAt: inserted.created_at } }
})
