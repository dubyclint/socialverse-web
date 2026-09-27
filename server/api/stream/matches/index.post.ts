import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

interface CreateMatchBody {
  mode?: Database['public']['Enums']['stream_match_mode']
  durationSeconds?: number
  streamId?: string
  side?: 1 | 2
}

/** Opens a pending battle with the creator's stream on the chosen side. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<CreateMatchBody>(event)
  const supabase = await serverSupabaseClient<Database>(event)

  if (!body.streamId) throw createError({ statusCode: 400, statusMessage: 'streamId is required' })

  const duration = body.durationSeconds ?? 300
  if (duration < 30 || duration > 3600) {
    throw createError({ statusCode: 400, statusMessage: 'durationSeconds must be between 30 and 3600' })
  }

  const { data: stream } = await supabase
    .from('streams')
    .select('id, creator_id')
    .eq('id', body.streamId)
    .maybeSingle()

  if (!stream) throw createError({ statusCode: 404, statusMessage: 'Stream not found' })
  if (stream.creator_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Only the broadcaster can open a battle' })
  }

  const { data: match, error } = await supabase
    .from('stream_matches')
    .insert({ mode: body.mode ?? 'SOLO', duration_seconds: duration, created_by: user.id })
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })

  const { error: joinError } = await supabase
    .from('stream_match_participants')
    .insert({ match_id: match.id, stream_id: body.streamId, user_id: user.id, side: body.side ?? 1 })

  if (joinError) throw createError({ statusCode: 400, statusMessage: joinError.message })

  return { match }
})
