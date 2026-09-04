import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

/** A co-host joins a pending battle with their own live stream. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ streamId?: string; side?: 1 | 2 }>(event)
  const supabase = await serverSupabaseClient<Database>(event)

  if (!id) throw createError({ statusCode: 400, statusMessage: 'Match id is required' })
  if (!body.streamId) throw createError({ statusCode: 400, statusMessage: 'streamId is required' })

  const { data: match } = await supabase
    .from('stream_matches')
    .select('id, status, mode')
    .eq('id', id)
    .maybeSingle()

  if (!match) throw createError({ statusCode: 404, statusMessage: 'Match not found' })
  if (match.status !== 'PENDING') {
    throw createError({ statusCode: 409, statusMessage: 'Match is no longer open to join' })
  }

  const { data: stream } = await supabase
    .from('streams')
    .select('id, creator_id')
    .eq('id', body.streamId)
    .maybeSingle()

  if (!stream || stream.creator_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'You can only join with your own stream' })
  }

  const { data: existing } = await supabase
    .from('stream_match_participants')
    .select('side')
    .eq('match_id', id)

  const side = body.side ?? 2
  if (match.mode === 'SOLO' && (existing ?? []).some((p) => p.side === side)) {
    throw createError({ statusCode: 409, statusMessage: 'That side is already taken' })
  }

  const { data, error } = await supabase
    .from('stream_match_participants')
    .insert({ match_id: id, stream_id: body.streamId, user_id: user.id, side })
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { participant: data }
})
