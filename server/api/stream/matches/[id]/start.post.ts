import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Match id is required' })

  const supabase = await serverSupabaseClient<Database>(event)
  const { data, error } = await supabase.rpc('start_stream_match', {
    p_match_id: id,
    p_actor_id: user.id
  })

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { endsAt: data }
})
