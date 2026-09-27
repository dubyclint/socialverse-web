import { createError, defineEventHandler, setHeader } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireUser } from '~/server/utils/auth'

/** Account-info export: every message the user sent, as a JSON download. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
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
