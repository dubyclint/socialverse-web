// FILE 6: server/api/stream/[id].put.ts - UPDATE STREAM
// ============================================================================
// UPDATE STREAM DETAILS
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface UpdateStreamRequest {
  title?: string
  description?: string
  category?: string
  privacy?: string
  thumbnail_url?: string
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const { id: streamId } = event.context.params
    const body = await readBody<UpdateStreamRequest>(event)

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
        statusMessage: 'You do not have permission to update this stream'
      })
    }

    // Validate input
    if (body.title && body.title.length > 255) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Title must be less than 255 characters'
      })
    }

    if (body.category && !['just-chatting', 'gaming', 'music', 'art', 'cooking', 'fitness', 'education', 'other'].includes(body.category)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid category'
      })
    }

    if (body.privacy && !['public', 'pals-only', 'private'].includes(body.privacy)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid privacy setting'
      })
    }

    // Update stream
    const { data: updated, error: updateError } = await supabase
      .from('streams')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', streamId)
      .select()
      .single()

    if (updateError) throw updateError

    return {
      success: true,
      data: updated,
      message: 'Stream updated successfully'
    }
  } catch (error: any) {
    console.error('Update stream error:', error)
    throw error
  }
})
