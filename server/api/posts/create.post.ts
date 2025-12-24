// FILE: /server/api/posts/create.post.ts - FIXED
// ============================================================================
// CREATE POST ENDPOINT - Handle post creation with all features
// ✅ FIXED: Content validation
// ✅ FIXED: Privacy settings
// ✅ FIXED: Media handling
// ✅ FIXED: Scheduled posts
// ✅ FIXED: Draft saving
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface CreatePostRequest {
  content: string
  privacy: 'public' | 'friends' | 'private'
  tags?: string[]
  mentions?: string[]
  media?: Array<{
    url: string
    type: string
  }>
  scheduledAt?: string
  saveAsDraft?: boolean
}

interface CreatePostResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<CreatePostResponse> => {
  try {
    console.log('[Posts Create API] Processing post creation...')

    // ============================================================================
    // STEP 1: Authentication
    // ============================================================================
    const supabase = await serverSupabaseClient(event)
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error('[Posts Create API] ❌ Unauthorized')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const userId = session.user.id
    console.log('[Posts Create API] User ID:', userId)

    // ============================================================================
    // STEP 2: Read request body
    // ============================================================================
    const body = await readBody<CreatePostRequest>(event)
    console.log('[Posts Create API] Post data:', {
      contentLength: body.content?.length,
      privacy: body.privacy,
      mediaCount: body.media?.length || 0,
      tags: body.tags?.length || 0,
      mentions: body.mentions?.length || 0,
      saveAsDraft: body.saveAsDraft
    })

    // ============================================================================
    // STEP 3: Validate content
    // ============================================================================
    if (!body.content || body.content.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Post content is required'
      })
    }

    if (body.content.length > 5000) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Post content exceeds 5000 character limit'
      })
    }

    // ============================================================================
    // STEP 4: Validate privacy
    // ============================================================================
    const validPrivacy = ['public', 'friends', 'private']
    const privacy = body.privacy || 'public'

    if (!validPrivacy.includes(privacy)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid privacy setting'
      })
    }

    // ============================================================================
    // STEP 5: Validate scheduled time
    // ============================================================================
    let scheduledAt = null
    if (body.scheduledAt) {
      const scheduledDate = new Date(body.scheduledAt)
      if (scheduledDate <= new Date()) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Scheduled time must be in the future'
        })
      }
      scheduledAt = body.scheduledAt
    }

    console.log('[Posts Create API] ✅ Validation passed')

    // ============================================================================
    // STEP 6: Create post
    // ============================================================================
    console.log('[Posts Create API] Creating post...')

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: body.content.trim(),
        privacy,
        tags: body.tags || [],
        mentions: body.mentions || [],
        media: body.media || [],
        scheduled_at: scheduledAt,
        is_draft: body.saveAsDraft || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (postError) {
      console.error('[Posts Create API] ❌ Post creation error:', postError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create post: ' + postError.message
      })
    }

    console.log('[Posts Create API] ✅ Post created successfully')

    // ============================================================================
    // STEP 7: Return response
    // ============================================================================
    return {
      success: true,
      data: post,
      message: 'Post created successfully'
    }

  } catch (err: any) {
    console.error('[Posts Create API] ❌ Error:', err.message)
    
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred while creating post',
      data: { details: err.message }
    })
  }
})
