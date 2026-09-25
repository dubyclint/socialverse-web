import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const streamId = event.context.params?.id
  if (!streamId) throw createError({ statusCode: 400, statusMessage: 'Stream ID is required' })

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: stream, error: streamError } = await supabase
    .from('streams')
    .select('*')
    .eq('id', streamId)
    .single()

  if (streamError || !stream) {
    throw createError({ statusCode: 404, statusMessage: 'Stream not found' })
  }

  const [{ count: chatMessageCount }, { data: gifts }] = await Promise.all([
    supabase.from('stream_chats').select('id', { count: 'exact', head: true }).eq('stream_id', streamId),
    supabase.from('gift_transactions').select('credit_value').eq('stream_id', streamId)
  ])

  const totalGiftValue = (gifts || []).reduce((sum, gift) => sum + Number(gift.credit_value || 0), 0)

  const startedAt = stream.started_at ? new Date(stream.started_at).getTime() : null
  const endedAt = stream.ended_at ? new Date(stream.ended_at).getTime() : Date.now()

  return {
    success: true,
    data: {
      streamId: stream.id,
      title: stream.title,
      status: stream.broadcast_status,
      duration: startedAt ? Math.max(0, Math.round((endedAt - startedAt) / 1000)) : 0,
      viewerCount: stream.current_viewer_count,
      peakViewerCount: stream.peak_viewer_count,
      chatMessageCount: chatMessageCount || 0,
      giftCount: gifts?.length || 0,
      totalGiftValue,
      startedAt: stream.started_at,
      endedAt: stream.ended_at
    }
  }
})
