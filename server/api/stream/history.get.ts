// server/api/stream/history.get.ts
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const query = getQuery(event)
    const limit = parseInt(query.limit as string) || 20
    const offset = parseInt(query.offset as string) || 0

    const supabase = await serverSupabaseClient(event)

    const { data: streams, error } = await supabase
      .from('streams')
      .select(`
        *,
        viewer_count:stream_viewers(count),
        chat_count:stream_chat(count)
      `)
      .eq('broadcaster_id', user.id)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      success: true,
      data: streams || []
    }
  } catch (error: any) {
    throw error
  }
})
