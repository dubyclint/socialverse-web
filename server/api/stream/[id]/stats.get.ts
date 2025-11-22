// FILE 7: server/api/stream/[id]/stats.get.ts - GET STREAM STATISTICS
// ============================================================================
// RETRIEVE STREAM STATISTICS AND ANALYTICS
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const { id: streamId } = event.context.params

    if (!streamId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Stream ID is required'
      })
    }

    const supabase = await serverSupabaseClient(event)

    // Get stream details
    const { data: stream, error: streamError } = await supabase
      .from('streams')
      .select('*')
      .eq('id', streamId)
      .single()

    if (streamError || !stream) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Stream not found'
      })
    }

    // Get viewer count
    const { data: viewers } = await supabase
      .from('stream_viewers')
      .select('id')
      .eq('stream_id', streamId)

    // Get chat message count
    const { data: chatMessages } = await supabase
      .from('stream_chat')
      .select('id')
      .eq('stream_id', streamId)

    // Get gift count and total value
    const { data: gifts } = await supabase
      .from('pew_gifts')
      .select('*')
      .eq('target_id', streamId)
      .eq('target_type', 'stream')

    const totalGiftValue = gifts?.reduce((sum, gift) => sum + (gift.amount || 0), 0) || 0

    return {
      success: true,
      data: {
        streamId: stream.id,
        title: stream.title,
        status: stream.status,
        duration: stream.duration || 0,
        viewerCount: viewers?.length || 0,
        chatMessageCount: chatMessages?.length || 0,
        giftCount: gifts?.length || 0,
        totalGiftValue: totalGiftValue,
        quality: stream.quality,
        category: stream.category,
        privacy: stream.privacy,
        startedAt: stream.started_at,
        endedAt: stream.ended_at,
        recordingUrl: stream.recording_url,
        thumbnailUrl: stream.thumbnail_url,
        earnings: stream.earnings || 0
      }
    }
  } catch (error: any) {
    console.error('Get stats error:', error)
    throw error
  }
})
