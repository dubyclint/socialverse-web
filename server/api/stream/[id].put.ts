// FILE 6: server/api/stream/[id].put.ts - UPDATE STREAM
// ============================================================================
// UPDATE STREAM DETAILS
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'

interface UpdateStreamRequest {
  title?: string
  description?: string
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const streamId = event.context.params?.id
    const body = await readBody<UpdateStreamRequest>(event)

    if (!streamId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Stream ID is required'
      })
    }

  const _supabase = await serverSupabaseClient(event)

    // Verify ownership
    const { data: stream, error: streamError } = await _supabase
      .from('streams')
      .select('creator_id')
      .eq('id', streamId)
      .single()

    if (streamError || !stream) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Stream not found'
      })
    }

    if (stream.creator_id !== user.id) {
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

    // Update stream
    const { data: updated, error: updateError } = await _supabase
      .from('streams')
      .update({
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
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
