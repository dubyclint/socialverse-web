import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Stream ID is required' })

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: viewers, error } = await supabase
    .from('stream_viewers')
    .select('id, viewer_id, joined_at')
    .eq('stream_id', id)
    .eq('is_active', true)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true, count: viewers?.length || 0, viewers: viewers || [] }
})
