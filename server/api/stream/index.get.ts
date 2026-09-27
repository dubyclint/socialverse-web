import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

export interface LiveStreamCard {
  id: string
  title: string
  description: string | null
  creatorId: string
  creatorName: string | null
  creatorAvatar: string | null
  viewers: number
  startedAt: string | null
}

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const supabase = await serverSupabaseClient<Database>(event)

  const { data: streams, error } = await supabase
    .from('streams')
    .select('id, title, description, creator_id, current_viewer_count, started_at')
    .eq('broadcast_status', 'LIVE')
    .order('current_viewer_count', { ascending: false })
    .limit(50)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!streams?.length) return { success: true, data: [] as LiveStreamCard[] }

  const { data: creators } = await supabase
    .from('user')
    .select('user_id, username, display_name, avatar_url')
    .in('user_id', Array.from(new Set(streams.map(s => s.creator_id))))

  const creatorById = new Map((creators ?? []).map(c => [c.user_id, c]))

  const data: LiveStreamCard[] = streams.map(stream => {
    const creator = creatorById.get(stream.creator_id)
    return {
      id: stream.id,
      title: stream.title,
      description: stream.description,
      creatorId: stream.creator_id,
      creatorName: creator?.display_name || creator?.username || null,
      creatorAvatar: creator?.avatar_url ?? null,
      viewers: stream.current_viewer_count ?? 0,
      startedAt: stream.started_at
    }
  })

  return { success: true, data }
})
