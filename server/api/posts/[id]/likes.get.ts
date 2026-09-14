import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export interface PostLikerView {
  id: string
  username: string
  name: string
  avatar: string | null
  likedAt: string
}

export default defineEventHandler(async (event): Promise<{ success: boolean, data: PostLikerView[] }> => {
  const postId = getRouterParam(event, 'id')
  if (!postId) throw createError({ statusCode: 400, statusMessage: 'Post id is required' })

  const query = getQuery(event)
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(query.limit ?? '30'), 10) || 30))

  const client = await serverSupabaseClient<Database>(event)

  const { data: likes, error } = await client
    .from('post_likes')
    .select('user_id, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const userIds = Array.from(new Set((likes ?? []).map(row => row.user_id)))
  const { data: users } = userIds.length
    ? await client
        .from('user')
        .select('user_id, username, display_name, full_name, avatar_url')
        .in('user_id', userIds)
    : { data: [] }

  const userById = new Map((users ?? []).map(row => [row.user_id, row]))

  return {
    success: true,
    data: (likes ?? []).map((row) => {
      const profile = userById.get(row.user_id)
      return {
        id: row.user_id,
        username: profile?.username ?? 'unknown',
        name: profile?.full_name || profile?.display_name || profile?.username || 'Unknown user',
        avatar: profile?.avatar_url ?? null,
        likedAt: row.created_at
      }
    })
  }
})
