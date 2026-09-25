import { createError, defineEventHandler, setHeader } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { getServiceClient } from '~/server/utils/supabase-admin'

/** Account-info export: every message the user sent, as a JSON download. */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const service = getServiceClient()
  const { data, error } = await service
    .from('chat_messages')
    .select('id, room_id, message_text, attachment_urls, message_type, created_at, edited_at')
    .eq('sender_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not export chat history' })

  setHeader(event, 'content-type', 'application/json')
  setHeader(event, 'content-disposition', 'attachment; filename="viorp-chat-history.json"')

  return {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    messages: data ?? []
  }
})
