// FILE: /server/api/posts/[id]/update.post.ts - FIXED
// ============================================================================
// UPDATE POST ENDPOINT - Update post content and settings
// ✅ FIXED: Content validation
// ✅ FIXED: Ownership verification
// ✅ FIXED: Comprehensive error handling
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface UpdatePostRequest {
  content?: string
  privacy?: 'public' | 'friends' | 'private'
  tags?: string[]
}

interface UpdatePostResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<UpdatePostResponse> => {
  try {
    console.log('[Posts Update API] Processing post update...')

    // ============================================================================
    // STEP 1: Authentication
    // ============================================================================
    const supabase = await serverSupabaseClient(event)
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error('[Posts Update API] ❌ Unauthorized')
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

    console.log('[Posts Update API] User ID:', userId, 'Post ID:', postId)

    // ============================================================================
    // STEP 2: Get post and verify ownership
    // ============================================================================
    console.log('[Posts Update API] Verifying post ownership...')

    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('_id', postId)
      .single()

    if (postError) {
      console.error('[Posts Update API] ❌ Post not found')
      throw createError({
        statusCode: 404,
        statusMessage: 'Post not found'
      })
    }

    if (post.user_id !== userId) {
      console.error('[Posts Update API] ❌ Unauthorized - not post owner')
      throw createError({
        statusCode: 403,
        statusMessage: 'You can only edit your own posts'
      })
    }

    console.log('[Posts Update API] ✅ Ownership verified')

    // ============================================================================
    // STEP 3: Read request body
    // ============================================================================
    const body = await readBody<UpdatePostRequest>(event)

    // ============================================================================
    // STEP 4: Validate updates
    // ============================================================================
    const updates: any = {}

    if (body.content !== undefined) {
      if (body.content.length > 5000) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Post content exceeds 5000 character limit'
        })
      }
      updates.content = body.content.trim()
    }

    if (body.privacy !== undefined) {
      const validPrivacy = ['public', 'friends', 'private']
      if (!validPrivacy.includes(body.privacy)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid privacy setting'
        })
      }
      updates.privacy = body.privacy
    }

    if (body.tags !== undefined) {
      updates.tags = body.tags
    }

    updates.updated_at = new Date().toISOString()

    console.log('[Posts Update API] ✅ Validation passed')

    // ============================================================================
    // STEP 5: Update post
    // ============================================================================
    console.log('[Posts Update API] Updating post...')

    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update(updates)
      .eq('_id', postId)
      .select()
      .single()

    if (updateError) {
      console.error('[Posts Update API] ❌ Update error:', updateError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update post: ' + updateError.message
      })
    }

    console.log('[Posts Update API] ✅ Post updated successfully')

    // ============================================================================
    // STEP 6: Return response
    // ============================================================================
    return {
      success: true,
      data: updatedPost,
      message: 'Post updated successfully'
    }

  } catch (err: any) {
    console.error('[Posts Update API] ❌ Error:', err.message)
    
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred while updating post',
      data: { details: err.message }
    })
  }
})
