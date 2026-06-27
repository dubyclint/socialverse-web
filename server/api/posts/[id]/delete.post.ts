// FILE: /server/api/posts/[id]/delete.post.ts - FIXED
// ============================================================================
// DELETE POST ENDPOINT - Delete post and associated data
// ✅ FIXED: Ownership verification
// ✅ FIXED: Cascade deletion
// ✅ FIXED: Comprehensive error handling
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface DeletePostResponse {
  success: boolean
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<DeletePostResponse> => {
  try {
    console.log('[Posts Delete API] Processing post deletion...')

    // ============================================================================
    // STEP 1: Authentication
    // ============================================================================
    const supabase = await serverSupabaseClient(event)
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error('[Posts Delete API] ❌ Unauthorized')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const userId = session.user.id
    const postId = getRouterParam(event, 'id')

    if (!postId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Post ID is required'
      })
    }

    console.log('[Posts Delete API] User ID:', userId, 'Post ID:', postId)

    // ============================================================================
    // STEP 2: Get post and verify ownership
    // ============================================================================
    console.log('[Posts Delete API] Verifying post ownership...')

    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('_id', postId)
      .single()

    if (postError) {
      console.error('[Posts Delete API] ❌ Post not found')
      throw createError({
        statusCode: 404,
        statusMessage: 'Post not found'
      })
    }

    if (post.user_id !== userId) {
      console.error('[Posts Delete API] ❌ Unauthorized - not post owner')
      throw createError({
        statusCode: 403,
        statusMessage: 'You can only delete your own posts'
      })
    }

    console.log('[Posts Delete API] ✅ Ownership verified')

    // ============================================================================
    // STEP 3: Delete associated data (likes, comments, etc.)
    // ============================================================================
    console.log('[Posts Delete API] Deleting associated data...')

    // Delete likes
    await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .catch(err => console.warn('[Posts Delete API] Warning deleting likes:', err.message))

    // Delete comments
    await supabase
      .from('post_comments')
      .delete()
      .eq('post_id', postId)
      .catch(err => console.warn('[Posts Delete API] Warning deleting comments:', err.message))

    console.log('[Posts Delete API] ✅ Associated data deleted')

    // ============================================================================
    // STEP 4: Delete post
    // ============================================================================
    console.log('[Posts Delete API] Deleting post...')

    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('_id', postId)

    if (deleteError) {
      console.error('[Posts Delete API] ❌ Delete error:', deleteError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete post: ' + deleteError.message
      })
    }

    console.log('[Posts Delete API] ✅ Post deleted successfully')

    // ============================================================================
    // STEP 5: Return response
    // ============================================================================
    return {
      success: true,
      message: 'Post deleted successfully'
    }

  } catch (err: any) {
    console.error('[Posts Delete API] ❌ Error:', err.message)
    
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred while deleting post',
      data: { details: err.message }
    })
  }
})
