// FILE 3: server/api/stream/[id]/chat.get.ts - GET STREAM CHAT MESSAGES
// ============================================================================
// RETRIEVE CHAT MESSAGES FOR A STREAM
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const { id: streamId } = event.context.params
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 50, 100)
    const offset = parseInt(query.offset as string) || 0

    if (!streamId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Stream ID is required'
      })
    }

    const supabase = await serverSupabaseClient(event)

    // Get chat messages
    const { data: messages, error } = await supabase
      .from('stream_chat')
      .select('*')
      .eq('stream_id', streamId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      success: true,
      data: messages || [],
      count: messages?.length || 0
    }
  } catch (error: any) {
    console.error('Get chat error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to get chat messages'
    })
  }
})
