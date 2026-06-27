import { serverSupabaseClient } from '#supabase/server'

interface FeedResponse {
  success: boolean
  data?: {
    posts: any[]
    total: number
    page: number
    limit: number
    hasMore: boolean
  }
  message?: string
}

export default defineEventHandler(async (event): Promise<FeedResponse> => {
  try {
    const contextUser: any = event.context.user
    const userId = contextUser?.id || contextUser?.user_id || null

    if (!userId) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const query = getQuery(event)
    const page = Math.max(1, Number.parseInt(String(query.page ?? '1'), 10) || 1)
    const limit = Math.min(50, Math.max(1, Number.parseInt(String(query.limit ?? '12'), 10) || 12))
    const offset = (page - 1) * limit

    const supabase = await serverSupabaseClient(event)

    let friendIds: string[] = []
    try {
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('user_id, friend_id, status')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted')

      if (!error && Array.isArray(friendships)) {
        friendIds = friendships
          .map((f: any) => (f.user_id === userId ? f.friend_id : f.user_id))
          .filter(Boolean)
      }
    } catch (e) {
      console.warn('[Feed API] friendships lookup skipped:', e)
    }

    const ids = Array.from(new Set([userId, ...friendIds]))

    // Primary query (full filter set)
    let posts: any[] | null = null
    let count: number | null = 0

    let result = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .in('user_id', ids)
      .in('privacy', ['public', 'friends'])
      .eq('is_draft', false)
      .is('scheduled_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Fallback 1: remove scheduled filter
    if (result.error) {
      console.warn('[Feed API] primary query failed, fallback#1:', result.error.message)
      result = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .in('user_id', ids)
        .in('privacy', ['public', 'friends'])
        .eq('is_draft', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
    }

    // Fallback 2: self posts only, minimal assumptions
    if (result.error) {
      console.warn('[Feed API] fallback#1 failed, fallback#2:', result.error.message)
      result = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
    }

    if (result.error) {
      console.error('[Feed API] all queries failed:', result.error)
      throw createError({ statusCode: 500, statusMessage: 'Failed to fetch feed posts' })
    }

    posts = result.data ?? []
    count = result.count ?? 0

    const total = count ?? 0
    const hasMore = page * limit < total

    return {
      success: true,
      data: { posts, total, page, limit, hasMore },
      message: 'Feed posts fetched successfully'
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('[Feed API] internal error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' })
  }
})
