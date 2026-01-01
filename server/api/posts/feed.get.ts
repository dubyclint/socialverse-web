// ============================================================================
// COMPLETE FIX: /server/api/posts/feed.get.ts - CORRECTED
// ============================================================================
// GET FEED POSTS - FIXED: Proper authentication and error handling
// ✅ FIXED: Correct Supabase client initialization
// ✅ FIXED: Proper authentication check
// ✅ FIXED: Handle missing friendships table gracefully
// ✅ FIXED: Comprehensive error handling
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
    console.log('[Posts Feed API] Fetching feed posts...')

    // ============================================================================
    // STEP 1: Get Supabase client and authenticate
    // ============================================================================
    const supabase = await serverSupabaseClient(event)
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error('[Posts Feed API] ❌ Unauthorized - No session')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please log in'
      })
    }

    const userId = session.user.id
    console.log('[Posts Feed API] User ID:', userId)

    // ============================================================================
    // STEP 2: Parse pagination parameters
    // ============================================================================
    const query = getQuery(event)
    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(query.limit as string) || 12))
    const offset = (page - 1) * limit

    console.log('[Posts Feed API] Pagination:', { page, limit, offset })

    // ============================================================================
    // STEP 3: Get user's friends (if friendships table exists)
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
        console.log('[Posts Feed API] Friends count:', friendIds.length)
      } else if (friendshipsError) {
        console.warn('[Posts Feed API] ⚠️ Friendships table error (may not exist):', friendshipsError.message)
      }
    } catch (err) {
      console.warn('[Posts Feed API] ⚠️ Could not fetch friendships:', err)
    }

    const allUserIds = [userId, ...friendIds]

    // ============================================================================
    // STEP 4: Fetch feed posts
    // ============================================================================
    console.log('[Posts Feed API] Fetching posts...')

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
    // STEP 5: Return response
    // ============================================================================
    const total = count || 0
    const hasMore = (page * limit) < total

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
