import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

/** Post into an existing room the caller belongs to (used by trade chat). */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const chatId = getRouterParam(event, 'chatId')
  const { message } = await readBody<{ message?: string }>(event)

  if (!chatId) throw createError({ statusCode: 400, statusMessage: 'Missing chat id' })
  if (!message?.trim()) throw createError({ statusCode: 400, statusMessage: 'message is required' })
  if (message.length > 2000) throw createError({ statusCode: 400, statusMessage: 'message is too long' })

  const client = await serverSupabaseClient<Database>(event)

  const { data: membership } = await client
    .from('chat_room_members')
    .select('room_id')
    .eq('room_id', chatId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) throw createError({ statusCode: 403, statusMessage: 'Not a member of this chat' })

  const { data: inserted, error } = await client
    .from('chat_messages')
    .insert({ room_id: chatId, sender_id: user.id, message_text: message.trim() })
    .select('id, created_at')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  await client.from('chat_rooms').update({ updated_at: new Date().toISOString() }).eq('id', chatId)

  return { success: true, data: { roomId: chatId, messageId: inserted.id, createdAt: inserted.created_at } }
})
