import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const streamId = event.context.params?.id
  const query = getQuery(event)
  const limit = Math.min(parseInt(query.limit as string) || 50, 100)
  const offset = parseInt(query.offset as string) || 0

  if (!streamId) throw createError({ statusCode: 400, statusMessage: 'Stream ID is required' })

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: messages, error } = await supabase
    .from('stream_chats')
    .select('id, stream_id, user_id, message_text, is_pinned, created_at')
    .eq('stream_id', streamId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return {
    success: true,
    data: messages || [],
    count: messages?.length || 0
  }
})
