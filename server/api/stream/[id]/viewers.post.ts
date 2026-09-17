// FILE 5: server/api/stream/[id]/viewers.post.ts - TRACK STREAM VIEWER
// ============================================================================
// ADD/UPDATE VIEWER TO STREAM
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'

interface ViewerRequest {
  action: 'join' | 'leave'
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const { id: streamId } = event.context.params
    const body = await readBody<ViewerRequest>(event)

    if (!streamId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Stream ID is required'
      })
    }

    if (!body.action || !['join', 'leave'].includes(body.action)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Action must be "join" or "leave"'
      })
    }

  const _supabase = await serverSupabaseClient(event)

    if (body.action === 'join') {
      // Add viewer
      const { error } = await _supabase
        .from('stream_viewers')
        .insert({
          stream_id: streamId,
          viewer_id: user.id,
          joined_at: new Date().toISOString(),
          is_active: true
        })

      if (error && error.code !== '23505') {
        // 23505 is unique constraint violation - viewer already joined
        throw error
      }

      // Update stream viewer count
      const { data: viewers } = await _supabase
        .from('stream_viewers')
        .select('id')
        .eq('stream_id', streamId)
        .eq('is_active', true)

      await _supabase
        .from('streams')
        .update({ viewer_count: viewers?.length || 0 })
        .eq('id', streamId)

      return {
        success: true,
        message: 'Joined stream'
      }
    } else {
      // Remove viewer
      const { error } = await _supabase
        .from('stream_viewers')
        .update({
          is_active: false,
          left_at: new Date().toISOString()
        })
        .eq('stream_id', streamId)
        .eq('viewer_id', user.id)

      if (error) throw error

      // Update stream viewer count
      const { data: viewers } = await _supabase
        .from('stream_viewers')
        .select('id')
        .eq('stream_id', streamId)
        .eq('is_active', true)

      await _supabase
        .from('streams')
        .update({ viewer_count: viewers?.length || 0 })
        .eq('id', streamId)

      return {
        success: true,
        message: 'Left stream'
      }
    }
  } catch (error: any) {
    console.error('Viewer tracking error:', error)
    throw error
  }
})
