import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

/** Live and pending battles, newest first. */
export default defineEventHandler(async (event) => {
  const { status } = getQuery(event) as { status?: Database['public']['Enums']['stream_match_state'] }
  const supabase = await serverSupabaseClient<Database>(event)

  const { data, error } = await supabase
    .from('stream_matches')
    .select('*, stream_match_participants(stream_id, user_id, side, score)')
    .eq('status', status ?? 'LIVE')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { matches: data ?? [] }
})
