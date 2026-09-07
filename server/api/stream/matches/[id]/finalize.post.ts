import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

/**
 * Settles an expired battle. Safe to call from any client at 00:00 — the
 * function refuses to finalise early and is idempotent afterwards.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Match id is required' })

  const supabase = await serverSupabaseClient<Database>(event)
  const { data, error } = await supabase.rpc('finalize_stream_match', { p_match_id: id })

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { winningSide: data, draw: data === null }
})
