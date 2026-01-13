// ============================================================================
// FIXED: /server/api/posts/feed.get.ts - USES JWT FROM MIDDLEWARE
// ============================================================================
// GET FEED POSTS - FIXED: Uses JWT from auth middleware instead of Supabase session
// ✅ FIXED: Uses event.context.user from JWT middleware
// ✅ FIXED: Proper authentication and error handling
// ============================================================================

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
  error?: string
}

export default defineEventHandler(async (event): Promise<FeedResponse> => {
  try {
    console.log('[Posts Feed API] ============ FETCH FEED START ============')
    console.log('[Posts Feed API] Fetching feed posts...')

    // ============================================================================
    // STEP 1: Get user from JWT middleware (NOT from Supabase session)
    // ============================================================================
    const user = event.context.user
    
    if (!user || !user.id) {
      console.error('[Posts Feed API] ❌ Unauthorized - No user in context')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please log in'
      })
    }

    const userId = user.id
    console.log('[Posts Feed API] ✅ User authenticated:', userId)
    console.log('[Posts Feed API] User email:', user.email)

    // ============================================================================
    // STEP 2: Parse pagination parameters
    // ============================================================================
    const query = getQuery(event)
    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(query.limit as string) || 12))
    const offset = (page - 1) * limit

    console.log('[Posts Feed API] Pagination:', { page, limit, offset })

    // ============================================================================
    // STEP 3: Get Supabase client for database queries
    // ============================================================================
    const supabase = await serverSupabaseClient(event)
    console.log('[Posts Feed API] Supabase client initialized')

    // ============================================================================
    // STEP 4: Get user's friends (if friendships table exists)
    // ============================================================================
    console.log('[Posts Feed API] Getting user friends...')

    let friendIds: string[] = []
    
    try {
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`(user_id.eq.${userId}),(friend_id.eq.${userId})`)
        .eq('status', 'accepted')

      if (!friendshipsError && friendships) {
        friendIds = friendships.map(f => f.user_id === userId ? f.friend_id : f.user_id)
        console.log('[Posts Feed API] ✅ Friends count:', friendIds.length)
      } else if (friendshipsError) {
        console.warn('[Posts Feed API] ⚠️ Friendships table error (may not exist):', friendshipsError.message)
      }
    } catch (err) {
      console.warn('[Posts Feed API] ⚠️ Could not fetch friendships:', err)
    }

    const allUserIds = [userId, ...friendIds]
    console.log('[Posts Feed API] Total user IDs to query:', allUserIds.length)

    // ============================================================================
    // STEP 5: Fetch feed posts
    // ============================================================================
    console.log('[Posts Feed API] Fetching posts from database...')

    const { data: posts, error: postsError, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .in('user_id', allUserIds)
      .in('privacy', ['public', 'friends'])
      .eq('is_draft', false)
      .is('scheduled_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (postsError) {
      console.error('[Posts Feed API] ❌ Posts fetch error:', postsError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch posts: ' + postsError.message
      })
    }

    console.log('[Posts Feed API] ✅ Posts fetched successfully, count:', posts?.length || 0)

    // ============================================================================
    // STEP 6: Return response
    // ============================================================================
    const total = count || 0
    const hasMore = (page * limit) < total

    console.log('[Posts Feed API] ============ FETCH FEED END (SUCCESS) ============')

    return {
      success: true,
      data: {
        posts: posts || [],
        total,
        page,
        limit,
        hasMore
      },
      message: 'Feed posts fetched successfully'
    }

  } catch (err: any) {
    console.error('[Posts Feed API] ❌ Error:', err.message)
    console.log('[Posts Feed API] ============ FETCH FEED END (ERROR) ============')
    
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred while fetching feed',
      data: { details: err.message }
    })
  }
})
