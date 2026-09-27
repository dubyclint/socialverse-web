import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

/**
 * Authoritative battle state: the countdown is derived from ends_at on the
 * server clock, so clients cannot drift or extend a match.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Match id is required' })

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: match, error } = await supabase
    .from('stream_matches')
    .select('*, stream_match_participants(stream_id, user_id, side, score)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!match) throw createError({ statusCode: 404, statusMessage: 'Match not found' })

  const participants = match.stream_match_participants ?? []
  const sideOne = participants.filter((p) => p.side === 1).reduce((sum, p) => sum + Number(p.score), 0)
  const sideTwo = participants.filter((p) => p.side === 2).reduce((sum, p) => sum + Number(p.score), 0)
  const total = sideOne + sideTwo

  const now = Date.now()
  const endsAt = match.ends_at ? new Date(match.ends_at).getTime() : null
  const secondsRemaining = endsAt ? Math.max(0, Math.round((endsAt - now) / 1000)) : null

  return {
    match,
    participants,
    score: {
      sideOne,
      sideTwo,
      // Tug-of-war position: 0.5 is even, 0 is a side-one sweep.
      position: total > 0 ? sideTwo / total : 0.5
    },
    secondsRemaining,
    serverTime: new Date(now).toISOString()
  }
})
