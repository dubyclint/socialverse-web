// FILE: /server/api/posts/user/[userId].get.ts (FIXED - COMPLETE VERSION)
// ============================================================================
// GET POSTS BY USER ID - FIXED: Proper error handling and validation
// ============================================================================
// ✅ CRITICAL FIX: Properly extracts user ID from route parameter
// ✅ Validates user ID is not empty
// ✅ Validates pagination parameters
// ✅ Returns proper error codes (400, 404, 500)
// ✅ Comprehensive error handling at each step
// ✅ Detailed logging for debugging
// ✅ Proper response structure with pagination info
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface PostsResponse {
  success: boolean
  posts: Array<any>
  total: number
  page: number
  limit: number
  has_more: boolean
}

export default defineEventHandler(async (event): Promise<PostsResponse> => {
  try {
    console.log('[Posts API] ========================================')
    console.log('[Posts API] Fetching user posts...')
    console.log('[Posts API] ========================================')

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
      console.error('[Posts API] ❌ Invalid user ID format:', userId)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid user ID format'
      })
    }

    console.log('[Posts API] ✅ User ID format is valid')

    // ============================================================================
    // STEP 4: Extract and validate pagination parameters
    // ============================================================================
    console.log('[Posts API] Step 4: Extracting pagination parameters...')
    
    const query = getQuery(event)
    
    // ✅ Parse page parameter with validation
    let page = 1
    if (query.page) {
      const parsedPage = parseInt(query.page as string)
      if (!isNaN(parsedPage) && parsedPage > 0) {
        page = parsedPage
      } else {
        console.warn('[Posts API] ⚠️ Invalid page parameter:', query.page, 'using default: 1')
      }
    }

    // ✅ Parse limit parameter with validation
    let limit = 12
    if (query.limit) {
      const parsedLimit = parseInt(query.limit as string)
      if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
        limit = parsedLimit
      } else {
        console.warn('[Posts API] ⚠️ Invalid limit parameter:', query.limit, 'using default: 12')
      }
    }

    const offset = (page - 1) * limit

    console.log('[Posts API] ✅ Pagination parameters:', { page, limit, offset })

    // ============================================================================
    // STEP 5: Verify user exists
    // ============================================================================
    console.log('[Posts API] Step 5: Verifying user exists...')
    
    try {
      const { data: userExists, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      if (userError && userError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (not found)
        console.warn('[Posts API] ⚠️ User verification query error:', userError.message)
      }

      if (!userExists && userError?.code === 'PGRST116') {
        console.error('[Posts API] ❌ User not found:', userId)
        throw createError({
          statusCode: 404,
          statusMessage: 'User not found'
        })
      }

      console.log('[Posts API] ✅ User verified')
    } catch (err: any) {
      if (err.statusCode === 404) {
        throw err
      }
      console.warn('[Posts API] ⚠️ User verification failed:', err.message)
      // Continue anyway - user might exist but profile not created yet
    }

    // ============================================================================
    // STEP 6: Fetch posts by user ID
    // ============================================================================
    console.log('[Posts API] Step 6: Fetching posts from database...')
    
    let posts = []
    let total = 0

    try {
      // ✅ CRITICAL FIX: Properly fetch posts with user ID
      const { data: fetchedPosts, error: postsError, count } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .is('is_deleted', false) // Only non-deleted posts
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (postsError) {
        console.error('[Posts API] ❌ Posts query error:', postsError.message)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to fetch posts'
        })
      }

      posts = fetchedPosts || []
      total = count || 0

      console.log('[Posts API] ✅ Posts fetched successfully')
      console.log('[Posts API] Total posts:', total)
      console.log('[Posts API] Posts in this page:', posts.length)
    } catch (err: any) {
      if (err.statusCode) {
        throw err
      }
      console.error('[Posts API] ❌ Posts fetch failed:', err.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch posts'
      })
    }

    // ============================================================================
    // STEP 7: Calculate pagination info
    // ============================================================================
    console.log('[Posts API] Step 7: Calculating pagination info...')
    
    const has_more = (page * limit) < total
    const totalPages = Math.ceil(total / limit)

    console.log('[Posts API] ✅ Pagination info calculated')
    console.log('[Posts API] Current page:', page)
    console.log('[Posts API] Total pages:', totalPages)
    console.log('[Posts API] Has more:', has_more)

    // ============================================================================
    // STEP 8: Build and return response
    // ============================================================================
    console.log('[Posts API] Step 8: Building response...')

    // ✅ CRITICAL FIX: Ensure all required fields are present
    const response: PostsResponse = {
      success: true,
      posts,
      total,
      page,
      limit,
      has_more
    }

    console.log('[Posts API] ========================================')
    console.log('[Posts API] ✅ Posts fetched successfully')
    console.log('[Posts API] User ID:', userId)
    console.log('[Posts API] Posts count:', posts.length)
    console.log('[Posts API] Total posts:', total)
    console.log('[Posts API] Page:', page, 'of', totalPages)
    console.log('[Posts API] ========================================')

    return response

  } catch (error: any) {
    console.error('[Posts API] ========================================')
    console.error('[Posts API] ❌ ERROR:', error.message)
    console.error('[Posts API] Status Code:', error.statusCode)
    console.error('[Posts API] Stack:', error.stack)
    console.error('[Posts API] ========================================')

    // ✅ CRITICAL FIX: If it's already a proper error, throw it
    if (error.statusCode) {
      throw error
    }

    // Otherwise, wrap it
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch posts'
    })
  }
})
