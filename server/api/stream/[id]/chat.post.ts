import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const streamId = event.context.params?.id
  if (!streamId) throw createError({ statusCode: 400, statusMessage: 'Stream ID is required' })

  const body = await readBody<{ content?: string }>(event)
  if (!body.content?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Message content is required' })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: message, error } = await supabase
    .from('stream_chats')
    .insert({ stream_id: streamId, user_id: user.id, message_text: body.content.trim() })
    .select('id, stream_id, user_id, message_text, is_pinned, created_at')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true, data: message }
})
