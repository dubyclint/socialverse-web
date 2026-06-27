// server/api/posts/index.get.ts
import { serverSupabaseClient } from '#supabase/server'
import { defineEventHandler, getQuery, createError } from 'h3'

interface Profile {
  user_id: string
  username: string
  full_name: string
  avatar_url: string | null
  is_verified: boolean
}

interface Post {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
  likes_count: number
  is_draft: boolean
  privacy: string
  scheduled_at: string | null
  profiles?: Profile // Unified database map relational node
}

interface ApiResponse {
  success: boolean
  posts: Post[]        // Flattened array to prevent client iteration failure
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export default defineEventHandler(async (event): Promise<ApiResponse> => {
  try {
    console.log('[Posts API] ============ FETCH POSTS START ============')
    
    // Get user from context (set by auth middleware)
    const user = event.context.user
    if (!user || !user.id) {
      console.error('[Posts API] ❌ Unauthorized')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const userId = user.id
    console.log('[Posts API] User ID:', userId)

    // Parse query parameters
    const query = getQuery(event)
    const feedTrack = (query.feed_track as string) || 'for-you'
    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(query.limit as string) || 12))
    const offset = (page - 1) * limit

    console.log('[Posts API] Parameters:', { feedTrack, page, limit, offset })

    // Get Supabase client
    const supabase = await serverSupabaseClient(event)

    // Build base query
    // 🔴 CRITICAL FIX: Changed from '*' to select specific columns and JOIN profiles relational table
    let postsQuery = supabase
      .from('posts')
      .select(`
        id,
        user_id,
        title,
        content,
        created_at,
        likes_count,
        is_draft,
        privacy,
        scheduled_at,
        profiles!inner (
          user_id,
          username,
          full_name,
          avatar_url,
          is_verified
        )
      `, { count: 'exact' })
      .eq('is_draft', false)
      .is('scheduled_at', null)
      .in('privacy', ['public', 'friends'])

    // Apply feed track filtering
    if (feedTrack === 'following') {
      // Get user's friends
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`(user_id.eq.${userId}),(friend_id.eq.${userId})`)
        .eq('status', 'accepted')

      const friendIds = friendships?.map(f => f.user_id === userId ? f.friend_id : f.user_id) || []
      const allUserIds = [userId, ...friendIds]
      
      postsQuery = postsQuery.in('user_id', allUserIds)
    } else if (feedTrack === 'trending') {
      // Trending posts - order by likes
      postsQuery = postsQuery.order('likes_count', { ascending: false })
    } else {
      // For-you feed - all public posts ordered by date
      postsQuery = postsQuery.order('created_at', { ascending: false })
    }

    // Apply pagination boundary ranges
    postsQuery = postsQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: posts, error: postsError, count } = await postsQuery

    if (postsError) {
      console.error('[Posts API] ❌ Database error:', postsError.message)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${postsError.message}`
      })
    }

    console.log('[Posts API] ✅ Posts fetched:', posts?.length || 0)

    const total = count || 0
    const hasMore = (page * limit) < total

    // 🔴 CRITICAL FIX: Flattened response shape directly to top-level object
    return {
      success: true,
      posts: (posts as unknown as Post[]) || [],
      total,
      page,
      limit,
      hasMore
    }

  } catch (err: any) {
    console.error('[Posts API] ❌ Error:', err.message)
    
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to fetch posts'
    })
  }
})
