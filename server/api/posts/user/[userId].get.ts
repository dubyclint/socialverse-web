// FILE: /server/api/posts/user/[userId].get.ts - FIXED
// ============================================================================
// GET POSTS BY USER ID - FIXED: Pagination, privacy filtering, sorting
// ✅ FIXED: Pagination support
// ✅ FIXED: Privacy filtering
// ✅ FIXED: Sorting by date
// ✅ FIXED: Comprehensive error handling
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface PostsResponse {
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

export default defineEventHandler(async (event): Promise<PostsResponse> => {
  try {
    console.log('[Posts User API] Fetching user posts...')

    // ============================================================================
    // STEP 1: Get Supabase client and session
    // ============================================================================
    const supabase = await serverSupabaseClient(event)
    
    const { data: { session } } = await supabase.auth.getSession()
    const currentUserId = session?.user?.id

    // ============================================================================
    // STEP 2: Get user ID from route parameter
    // ============================================================================
    const userId = getRouterParam(event, 'userId')
    const query = getQuery(event)

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    console.log('[Posts User API] User ID:', userId)

    // ============================================================================
    // STEP 3: Parse pagination parameters
    // ============================================================================
    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(query.limit as string) || 12))
    const offset = (page - 1) * limit

    console.log('[Posts User API] Pagination:', { page, limit, offset })

    // ============================================================================
    // STEP 4: Build privacy filter
    // ============================================================================
    let privacyFilter = ['public']

    if (currentUserId === userId) {
      // User viewing their own posts
      privacyFilter = ['public', 'friends', 'private']
    } else if (currentUserId) {
      // Check if users are friends
      const { data: friendship } = await supabase
        .from('friendships')
        .select('id')
        .or(`(user_id.eq.${currentUserId},friend_id.eq.${userId}),(user_id.eq.${userId},friend_id.eq.${currentUserId})`)
        .eq('status', 'accepted')
        .single()

      if (friendship) {
        privacyFilter = ['public', 'friends']
      }
    }

    console.log('[Posts User API] Privacy filter:', privacyFilter)

    // ============================================================================
    // STEP 5: Fetch posts with count
    // ============================================================================
    console.log('[Posts User API] Fetching posts...')

    const { data: posts, error: postsError, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .in('privacy', privacyFilter)
      .eq('is_draft', false)
      .is('scheduled_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (postsError) {
      console.error('[Posts User API] ❌ Posts fetch error:', postsError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch posts: ' + postsError.message
      })
    }

    console.log('[Posts User API] ✅ Posts fetched successfully')

    // ============================================================================
    // STEP 6: Return response
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
      message: 'Posts fetched successfully'
    }

  } catch (err: any) {
    console.error('[Posts User API] ❌ Error:', err.message)
    
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred while fetching posts',
      data: { details: err.message }
    })
  }
})
