// ============================================================================
// FIXED: /server/api/users/suggested.get.ts - USES JWT FROM MIDDLEWARE
// ============================================================================
// GET SUGGESTED USERS - FIXED: Uses JWT from auth middleware
// ✅ FIXED: Uses event.context.user from JWT middleware
// ✅ FIXED: Proper authentication and error handling
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('[Suggested Users API] ============ FETCH SUGGESTED USERS START ============')
    console.log('[Suggested Users API] Fetching suggested users...')

    // ============================================================================
    // STEP 1: Get user from JWT middleware (NOT from Supabase session)
    // ============================================================================
    const user = event.context.user
    
    if (!user || !user.id) {
      console.error('[Suggested Users API] ❌ Unauthorized - No user in context')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please log in'
      })
    }

    const userId = user.id
    console.log('[Suggested Users API] ✅ User authenticated:', userId)

    // ============================================================================
    // STEP 2: Get Supabase client for database queries
    // ============================================================================
    const supabase = await serverSupabaseClient(event)
    console.log('[Suggested Users API] Supabase client initialized')

    // ============================================================================
    // STEP 3: Parse query parameters
    // ============================================================================
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 5, 20)
    console.log('[Suggested Users API] Limit:', limit)

    // ============================================================================
    // STEP 4: Fetch suggested users from user_profiles table
    // ============================================================================
    console.log('[Suggested Users API] Fetching from user_profiles table...')

    const { data: suggestedUsers, error } = await supabase
      .from('user_profiles')
      .select('id, username, full_name, avatar_url, bio')
      .neq('id', userId)
      .limit(limit)

    if (error) {
      console.warn('[Suggested Users API] ⚠️ user_profiles table error:', error.message)
      // Return empty array instead of throwing error
      console.log('[Suggested Users API] ============ FETCH SUGGESTED USERS END (EMPTY) ============')
      return {
        success: true,
        data: [],
        total: 0,
        message: 'No suggested users available'
      }
    }

    console.log('[Suggested Users API] ✅ Suggested users fetched:', suggestedUsers?.length || 0)

    // ============================================================================
    // STEP 5: Format response
    // ============================================================================
    const formatted = (suggestedUsers || []).map((u: any) => ({
      id: u.id,
      full_name: u.full_name || 'Unknown',
      username: u.username || 'unknown',
      avatar_url: u.avatar_url || '/default-avatar.svg',
      bio: u.bio || '',
      followers_count: 0,
      following: false
    }))

    console.log('[Suggested Users API] ✅ Response formatted:', formatted.length)
    console.log('[Suggested Users API] ============ FETCH SUGGESTED USERS END (SUCCESS) ============')

    return {
      success: true,
      data: formatted,
      total: formatted.length
    }

  } catch (error: any) {
    console.error('[Suggested Users API] ❌ Error:', error.message)
    console.log('[Suggested Users API] ============ FETCH SUGGESTED USERS END (ERROR) ============')
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch suggested users',
      data: { details: error.message }
    })
  }
})

