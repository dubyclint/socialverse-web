// FILE 4: server/api/stream/[id].delete.ts - DELETE STREAM
// ============================================================================
// DELETE A STREAM AND ITS ASSOCIATED DATA
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const { id: streamId } = event.context.params

    if (!streamId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Stream ID is required'
      })
    }

    const supabase = await serverSupabaseClient(event)

    // Verify ownership
    const { data: stream, error: streamError } = await supabase
      .from('streams')
      .select('broadcaster_id')
      .eq('id', streamId)
      .single()

    if (streamError || !stream) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Stream not found'
      })
    }

    if (stream.broadcaster_id !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to delete this stream'
      })
    }

    // Delete stream (cascade will handle related data)
    const { error: deleteError } = await supabase
      .from('streams')
      .delete()
      .eq('id', streamId)

    if (deleteError) throw deleteError

    return {
      success: true,
      message: 'Stream deleted successfully'
    }
  } catch (error: any) {
    console.error('Delete stream error:', error)
    throw error
  }
})
