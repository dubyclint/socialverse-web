import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

export interface LiveCandidate {
  kind: 'stream' | 'battle'
  id: string
  streamId: string
  title: string
  creatorId: string
  creatorName: string | null
  creatorAvatar: string | null
  viewers: number
  matchId: string | null
  endsAt: string | null
  score: number
}

/**
 * Live streams and battles ranked for the "For You" rail. Battles outrank plain
 * streams and gift velocity outranks raw viewer count, so the most active rooms
 * surface first.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const supabase = await serverSupabaseClient<Database>(event)

  const { data: streams, error } = await supabase
    .from('streams')
    .select('id, title, creator_id, current_viewer_count, started_at')
    .eq('broadcast_status', 'LIVE')
    .order('current_viewer_count', { ascending: false })
    .limit(40)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!streams?.length) return { items: [] as LiveCandidate[] }

  const streamIds = streams.map((s) => s.id)
  const creatorIds = Array.from(new Set(streams.map((s) => s.creator_id)))

  const [{ data: participants }, { data: creators }] = await Promise.all([
    supabase
      .from('stream_match_participants')
      .select('match_id, stream_id, side, score, stream_matches!inner(status, ends_at)')
      .in('stream_id', streamIds)
      .eq('stream_matches.status', 'LIVE'),
    supabase.from('user').select('user_id, username, avatar_url').in('user_id', creatorIds)
  ])

  const creatorById = new Map((creators ?? []).map((c) => [c.user_id, c]))
  const battleByStream = new Map(
    (participants ?? []).map((p) => [p.stream_id, p])
  )

  const items: LiveCandidate[] = streams.map((stream) => {
    const creator = creatorById.get(stream.creator_id)
    const battle = battleByStream.get(stream.id)
    const viewers = stream.current_viewer_count ?? 0
    const battleScore = battle ? Number(battle.score) : 0

    return {
      kind: battle ? 'battle' : 'stream',
      id: battle ? battle.match_id : stream.id,
      streamId: stream.id,
      title: stream.title,
      creatorId: stream.creator_id,
      creatorName: creator?.username ?? null,
      creatorAvatar: creator?.avatar_url ?? null,
      viewers,
      matchId: battle?.match_id ?? null,
      endsAt: battle?.stream_matches?.ends_at ?? null,
      score: (battle ? 1000 : 0) + battleScore * 5 + viewers
    }
  })

  items.sort((a, b) => b.score - a.score)
  return { items: items.slice(0, 12) }
})
