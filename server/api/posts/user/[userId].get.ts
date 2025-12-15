// FILE 8: /server/api/posts/user/[userId].get.ts
// ============================================================================
// GET POSTS BY USER ID - IMPROVED: Enhanced error handling and graceful fallbacks
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface PostsResponse {
  success: boolean
  posts: Array<any>
  total: number
  page: number
  limit: number
  has_more: boolean
  message?: string
  error?: string
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
    
    let supabase
    try {
      supabase = await serverSupabaseClient(event)
    } catch (err: any) {
      console.error('[Posts API] ❌ Supabase initialization error:', err.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Supabase initialization failed: ' + err.message
      })
    }
    
    if (!supabase) {
      console.error('[Posts API] ❌ Supabase client not available')
      throw createError({
        statusCode: 500,
        statusMessage: 'Database client not available'
      })
    }

    console.log('[Posts API] ✅ Supabase client initialized')

    // ============================================================================
    // STEP 2: Extract user ID from route parameter
    // ============================================================================
    console.log('[Posts API] Step 2: Extracting user ID from route...')
    
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
    
    let page = 1
    if (query.page) {
      const parsedPage = parseInt(query.page as string)
      if (!isNaN(parsedPage) && parsedPage > 0) {
        page = parsedPage
      }
    }

    let limit = 12
    if (query.limit) {
      const parsedLimit = parseInt(query.limit as string)
      if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
        limit = parsedLimit
      }
    }

    const offset = (page - 1) * limit

    console.log('[Posts API] ✅ Pagination: page=' + page + ', limit=' + limit + ', offset=' + offset)

    // ============================================================================
    // STEP 5: Fetch posts by user ID
    // ============================================================================
    console.log('[Posts API] Step 5: Fetching posts from database...')
    
    let posts = []
    let total = 0

    try {
      const { data: fetchedPosts, error: postsError, count } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .is('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (postsError) {
        console.warn('[Posts API] ⚠️ Posts query error:', postsError.message, 'Code:', postsError.code)

        if (
          postsError.message.includes('does not exist') ||
          postsError.code === 'PGRST116' ||
          postsError.code === '42P01'
        ) {
          console.log('[Posts API] ℹ️ Posts table does not exist yet')
          
          return {
            success: true,
            posts: [],
            total: 0,
            page,
            limit,
            has_more: false,
            message: 'Posts table not yet created'
          }
        }

        throw postsError
      }

      posts = fetchedPosts || []
      total = count || 0

      console.log('[Posts API] ✅ Posts fetched successfully')
      console.log('[Posts API] Total posts:', total)
      console.log('[Posts API] Posts in this page:', posts.length)

    } catch (err: any) {
      console.error('[Posts API] ❌ Posts fetch failed:', err.message)

      if (
        err.message?.includes('does not exist') ||
        err.code === 'PGRST116' ||
        err.code === '42P01'
      ) {
        console.log('[Posts API] ℹ️ Returning empty posts (table not found)')
        
        return {
          success: true,
          posts: [],
          total: 0,
          page,
          limit,
          has_more: false,
          message: 'Posts table not yet created'
        }
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch posts: ' + err.message
      })
    }

    // ============================================================================
    // STEP 6: Calculate pagination info
    // ============================================================================
    const has_more = offset + limit < total

    console.log('[Posts API] ✅ Returning posts')

    return {
      success: true,
      posts,
      total,
      page,
      limit,
      has_more
    }

  } catch (error: any) {
    console.error('[Posts API] ❌ Error:', error.message || error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch posts: ' + (error.message || 'Unknown error')
    })
  }
})
