// server/api/stream/[id]/viewers.get.ts
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const { id } = event.context.params
    const supabase = await serverSupabaseClient(event)

    // Get active viewers count
    const { data: viewers, error } = await supabase
      .from('stream_viewers')
      .select('id')
      .eq('stream_id', id)
      .eq('is_active', true)

    if (error) throw error

    return {
      success: true,
      count: viewers?.length || 0,
      viewers: viewers || []
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }
})
