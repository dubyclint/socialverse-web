import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const streamId = event.context.params?.id
  const body = await readBody<{ action?: 'join' | 'leave' }>(event)

  if (!streamId) throw createError({ statusCode: 400, statusMessage: 'Stream ID is required' })
  if (body.action !== 'join' && body.action !== 'leave') {
    throw createError({ statusCode: 400, statusMessage: 'Action must be "join" or "leave"' })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  const { error } = body.action === 'join'
    ? await supabase
        .from('stream_viewers')
        .upsert(
          { stream_id: streamId, viewer_id: user.id, is_active: true, joined_at: new Date().toISOString(), left_at: null },
          { onConflict: 'stream_id,viewer_id' }
        )
    : await supabase
        .from('stream_viewers')
        .update({ is_active: false, left_at: new Date().toISOString() })
        .eq('stream_id', streamId)
        .eq('viewer_id', user.id)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const { data: viewerCount } = await supabase.rpc('sync_stream_viewer_counts', { p_stream_id: streamId })

  return {
    success: true,
    message: body.action === 'join' ? 'Joined stream' : 'Left stream',
    viewerCount: viewerCount ?? 0
  }
})
