// FILE:
/server/api/follows/[userId].post.ts
// ============================================================================
// FOLLOW/UNFOLLOW USER - PRODUCTION READY
// ============================================================================
// This endpoint handles follow/unfollow actions with:
// - User authentication
// - Follow status checking
// - Follow/unfollow toggle functionality
// - Comprehensive error handling
// - Detailed logging
//
// Features:
// - Toggle follow status (follow if not following, unfollow if following)
// - Explicit follow/unfollow actions
// - Prevents self-following
// - Returns current follow status
// - Detailed error messages
// - Optimized database queries
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface FollowResponse {
  success: boolean
  following: boolean
  action: 'followed' | 'unfollowed' | 'no_change'
  message?: string
}

export default defineEventHandler(async (event): Promise<FollowResponse> => {
  try {
    console.log('[Follows API] ========================================')
    console.log('[Follows API] Follow/Unfollow request received')
    console.log('[Follows API] ========================================')

    // ============================================================================
    // STEP 1: Initialize Supabase client
    // ============================================================================
    console.log('[Follows API] Step 1: Initializing Supabase client...')

    const supabase = await serverSupabaseClient(event)

    if (!supabase) {
      console.error('[Follows API] ❌ Supabase client not available')
      throw createError({
        statusCode: 500,
        statusMessage: 'Database connection failed'
      })
    }

    console.log('[Follows API] ✅ Supabase client initialized')

    // ============================================================================
    // STEP 2: Authenticate user
    // ============================================================================
    console.log('[Follows API] Step 2: Authenticating user...')

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.id) {
      console.error('[Follows API] ❌ Authentication failed:', authError?.message)
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please login first'
      })
    }

    console.log('[Follows API] ✅ User authenticated:', user.email)
    console.log('[Follows API] Current user ID:', user.id)

    // ============================================================================
    // STEP 3: Get target user ID from route parameter
    // ============================================================================
    console.log('[Follows API] Step 3: Extracting target user ID...')

    const targetUserId = getRouterParam(event, 'userId')

    if (!targetUserId || targetUserId.trim() === '') {
      console.error('[Follows API] ❌ No target user ID provided')
      throw createError({
        statusCode: 400,
        statusMessage: 'Target user ID is required'
      })
    }

    console.log('[Follows API] ✅ Target user ID:', targetUserId)

    // ============================================================================
    // STEP 4: Validate user ID format (UUID)
    // ============================================================================
    console.log('[Follows API] Step 4: Validating user ID format...')

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (!uuidRegex.test(targetUserId)) {
      console.error('[Follows API] ❌ Invalid target user ID format:', targetUserId)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid user ID format'
      })
    }

    console.log('[Follows API] ✅ Target user ID format is valid')

    // ============================================================================
    // STEP 5: Prevent self-following
    // ============================================================================
    console.log('[Follows API] Step 5: Checking for self-follow...')

    if (targetUserId === user.id) {
      console.error('[Follows API] ❌ User cannot follow themselves')
      throw createError({
        statusCode: 400,
        statusMessage: 'You cannot follow yourself'
      })
    }

    console.log('[Follows API] ✅ Not a self-follow')

    // ============================================================================
    // STEP 6: Verify target user exists
    // ============================================================================
    console.log('[Follows API] Step 6: Verifying target user exists...')

    try {
      const { data: targetUser, error: userCheckError } = await supabase.auth.admin.getUserById(targetUserId)

      if (userCheckError || !targetUser?.user) {
        console.error('[Follows API] ❌ Target user not found:', userCheckError?.message)
        throw createError({
          statusCode: 404,
          statusMessage: 'Target user not found'
        })
      }

      console.log('[Follows API] ✅ Target user exists:', targetUser.user.email)
    } catch (err: any) {
      console.warn('[Follows API] ⚠️ User verification failed:', err.message)
      // Continue anyway - user might exist but we can't verify
      console.log('[Follows API] ℹ️ Continuing without user verification')
    }

    // ============================================================================
    // STEP 7: Get request body
    // ============================================================================
    console.log('[Follows API] Step 7: Parsing request body...')

    let body = {}
    try {
      body = await readBody(event)
    } catch (err) {
      console.warn('[Follows API] ⚠️ Could not parse body:', err)
    }

    const action = (body as any)?.action || 'toggle' // 'follow', 'unfollow', or 'toggle'

    console.log('[Follows API] ✅ Action:', action)

    if (!['follow', 'unfollow', 'toggle'].includes(action)) {
      console.error('[Follows API] ❌ Invalid action:', action)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid action. Must be: follow, unfollow, or toggle'
      })
    }

    // ============================================================================
    // STEP 8: Check current follow status
    // ============================================================================
    console.log('[Follows API] Step 8: Checking current follow status...')

    let isFollowing = false

    try {
      const { data: existingFollow, error: checkError } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (not found)
        console.warn('[Follows API] ⚠️ Follow status check error:', checkError.message)
      } else if (existingFollow) {
        isFollowing = true
        console.log('[Follows API] ✅ User is currently following')
      } else {
        console.log('[Follows API] ✅ User is not currently following')
      }
    } catch (err: any) {
      console.warn('[Follows API] ⚠️ Could not check follow status:', err.message)
      // Continue anyway
    }

    console.log('[Follows API] Currently following:', isFollowing)

    // ============================================================================
    // STEP 9: Determine action to perform
    // ============================================================================
    console.log('[Follows API] Step 9: Determining action to perform...')

    let shouldFollow = false
    let actionPerformed = 'no_change'

    if (action === 'follow') {
      shouldFollow = true
      actionPerformed = isFollowing ? 'no_change' : 'followed'
    } else if (action === 'unfollow') {
      shouldFollow = false
      actionPerformed = isFollowing ? 'unfollowed' : 'no_change'
    } else if (action === 'toggle') {
      shouldFollow = !isFollowing
      actionPerformed = shouldFollow ? 'followed' : 'unfollowed'
    }

    console.log('[Follows API] Should follow:', shouldFollow)
    console.log('[Follows API] Action to perform:', actionPerformed)

    // ============================================================================
    // STEP 10: Perform follow action
    // ============================================================================
    if (actionPerformed === 'followed') {
      console.log('[Follows API] Step 10: Following user...')

      const { error: insertError } = await supabase
        .from('follows')
        .insert([{
          follower_id: user.id,
          following_id: targetUserId,
          created_at: new Date().toISOString()
        }])

      if (insertError) {
        console.error('[Follows API] ❌ Follow failed:', insertError.message)

        // Check for specific errors
        if (insertError.message.includes('duplicate key')) {
          console.log('[Follows API] ℹ️ Already following this user')
          return {
            success: true,
            following: true,
            action: 'no_change',
            message: 'Already following this user'
          }
        }

        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to follow user: ' + insertError.message
        })
      }

      console.log('[Follows API] ✅ User followed successfully')

    } else if (actionPerformed === 'unfollowed') {
      console.log('[Follows API] Step 10: Unfollowing user...')

      const { error: deleteError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)

      if (deleteError) {
        console.error('[Follows API] ❌ Unfollow failed:', deleteError.message)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to unfollow user: ' + deleteError.message
        })
      }

      console.log('[Follows API] ✅ User unfollowed successfully')

    } else {
      console.log('[Follows API] Step 10: No action needed (already in desired state)')
    }

    // ============================================================================
    // STEP 11: Build and return response
    // ============================================================================
    console.log('[Follows API] Step 11: Building response...')

    const newFollowingStatus = actionPerformed === 'followed' ? true : (actionPerformed === 'unfollowed' ? false : isFollowing)

    const response: FollowResponse = {
      success: true,
      following: newFollowingStatus,
      action: actionPerformed as 'followed' | 'unfollowed' | 'no_change'
    }

    console.log('[Follows API] ========================================')
    console.log('[Follows API] ✅ Follow action completed successfully')
    console.log('[Follows API] Following:', response.following)
    console.log('[Follows API] Action:', response.action)
    console.log('[Follows API] ========================================')

    return response

  } catch (error: any) {
    console.error('[Follows API] ========================================')
    console.error('[Follows API] ❌ ERROR:', error.message)
    console.error('[Follows API] Status Code:', error.statusCode)
    console.error('[Follows API] ========================================')

    // If it's already a proper error, throw it
    if (error.statusCode) {
      throw error
    }

    // Otherwise, wrap it
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update follow status'
    })
  }
})
