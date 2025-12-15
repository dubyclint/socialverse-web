// FILE: /server/api/posts/user/[userId].get.ts (COMPLETE FIXED VERSION)
// ============================================================================
// GET POSTS BY USER ID - FIXED: Proper error handling and validation
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface PostsResponse {
  success: boolean
  posts?: Array<any>
  total?: number
  page?: number
  limit?: number
  has_more?: boolean
  error?: string
}

export default defineEventHandler(async (event): Promise<PostsResponse> => {
  try {
    console.log('[Posts API] ======================================')
    console.log('[Posts API] Fetching user posts...')
    console.log('[Posts API] ======================================')

    // ============================================================================
    // STEP 1: Initialize Supabase client
    // ============================================================================
    console.log('[Posts API] Step 1: Initializing Supabase client...')
    
    const supabase = await serverSupabaseClient(event)
    
    if (!supabase) {
      console.error('[Posts API] ❌ Supabase client not available')
      throw createError({
        statusCode: 500,
        statusMessage: 'Database connection failed'
      })
    }

    console.log('[Posts API] ✅ Supabase client initialized')

    // ============================================================================
    // STEP 2: Extract user ID from route parameter
    // ============================================================================
    console.log('[Posts API] Step 2: Extracting user ID from route...')
    
    // ✅ CRITICAL FIX: Properly extract user ID from route parameter
    const userId = getRouterParam(event, 'userId')

    if (!userId || userId.trim() === '') {
      console.error('[Posts API] ❌ No user ID provided')
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    console.log('[Posts API] ✅ User ID extracted:', userId)

    // ============================================================================
    // STEP 3: Validate user ID format (UUID)
    // ============================================================================
    console.log('[Posts API] Step 3: Validating user ID format...')
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    
    if (!uuidRegex.test(userId)) {
      console.warn('[Posts API] ⚠️ Invalid user ID format (not UUID):', userId)
      // Continue anyway - might be a valid ID in different format
    }

    // ============================================================================
    // STEP 4: Extract and validate pagination parameters
    // ============================================================================
    console.log('[Posts API] Step 4: Extracting pagination parameters...')
    
    const query = getQuery(event)
    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 12))

    console.log('[Posts API] ✅ Pagination:', { page, limit })

    // ============================================================================
    // STEP 5: Fetch total count
    // ============================================================================
    console.log('[Posts API] Step 5: Fetching total count...')
    
    const { count, error: countError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      console.error('[Posts API] ❌ Count error:', countError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch posts count'
      })
    }

    const total = count || 0
    console.log('[Posts API] ✅ Total posts:', total)

    // ============================================================================
    // STEP 6: Fetch posts with pagination
    // ============================================================================
    console.log('[Posts API] Step 6: Fetching posts...')
    
    const offset = (page - 1) * limit

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (postsError) {
      console.error('[Posts API] ❌ Posts fetch error:', postsError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch posts'
      })
    }

    const has_more = offset + limit < total

    console.log('[Posts API] ✅ Posts fetched:', posts?.length || 0, `of ${total} total`)

    return {
      success: true,
      posts: posts || [],
      total,
      page,
      limit,
      has_more,
    }
  } catch (error: any) {
    console.error('[Posts API] ❌ Error:', error.message || error)
    
    // If it's already an H3 error, re-throw it
    if (error.statusCode) {
      throw error
    }
    
    // Otherwise, return 500 error
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
