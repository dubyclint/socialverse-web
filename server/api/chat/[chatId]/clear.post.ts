import { createError, defineEventHandler, getRouterParam } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { getServiceClient } from '~/server/utils/supabase-admin'

/** Clears the caller's own messages in a room; other members keep theirs. */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const chatId = getRouterParam(event, 'chatId')
  if (!chatId) throw createError({ statusCode: 400, statusMessage: 'Missing chat id' })

  const service = getServiceClient()

  const { data: membership } = await service
    .from('chat_room_members')
    .select('id')
    .eq('room_id', chatId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) throw createError({ statusCode: 403, statusMessage: 'Not a member of this chat' })

  const { data, error } = await service
    .from('chat_messages')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_for_everyone: false,
      message_text: null,
      attachment_urls: []
    })
    .eq('room_id', chatId)
    .eq('sender_id', user.id)
    .is('deleted_at', null)
    .select('id')

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true, cleared: data?.length ?? 0 }
})
