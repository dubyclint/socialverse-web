import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { requireUuid } from '~/server/utils/input'
import { enforceRateLimit } from '~/server/utils/rate-limit'
import type { Database } from '~/types/database.types'

/**
 * Viewer taps nudge the tug-of-war bar. Each tap is worth exactly one point and
 * the throttle lives in record_match_event, so batching from a client cannot
 * inflate a side.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ side?: 1 | 2 }>(event)
  const supabase = await serverSupabaseClient<Database>(event)

  const matchId = requireUuid(id, 'match id')
  if (body.side !== 1 && body.side !== 2) {
    throw createError({ statusCode: 400, statusMessage: 'side must be 1 or 2' })
  }

  await enforceRateLimit(event, 'battle:tap', { limit: 20, windowMs: 10_000 }, user.id)

  const { data, error } = await supabase.rpc('record_match_event', {
    p_match_id: matchId,
    p_actor_id: user.id,
    p_side: body.side,
    p_kind: 'TAP',
    p_points: 1
  })

  if (error) {
    const throttled = error.message.includes('tap rate limit')
    throw createError({ statusCode: throttled ? 429 : 400, statusMessage: error.message })
  }

  return { sideScore: data }
})
