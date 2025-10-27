// server/api/posts/create.post.ts
// ============================================================================
// CREATE POST ENDPOINT - Handle post creation with all features
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'
import { trackUpload } from '~/server/utils/storage'

interface CreatePostRequest {
  content: string
  privacy: 'public' | 'friends' | 'private'
  tags?: string[]
  mentions?: string[]
  media?: Array<{
    url: string
    thumbnailUrl?: string
    type: string
    mimeType: string
    size: number
  }>
  scheduledAt?: string
  saveAsDraft?: boolean
}

export default defineEventHandler(async (event) => {
  try {
    // ✅ Authenticate user
    const user = await requireAuth(event)
    if (!user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    // ✅ Parse request body
    const body = await readBody<CreatePostRequest>(event)

    // ✅ Validate content
    if (!body.content || body.content.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Post content is required'
      })
    }

    if (body.content.length > 2000) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Post content exceeds 2000 character limit'
      })
    }

    // ✅ Validate privacy
    const validPrivacy = ['public', 'friends', 'private']
    if (!validPrivacy.includes(body.privacy)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid privacy setting'
      })
    }

    // ✅ Validate scheduled time
    if (body.scheduledAt) {
      const scheduledDate = new Date(body.scheduledAt)
      if (scheduledDate <= new Date()) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Scheduled time must be in the future'
        })
      }
    }

    const supabase = await serverSupabaseClient(event)

    // ✅ If saving as draft, save to drafts table
    if (body.saveAsDraft) {
      const { error: draftError } = await supabase
        .from('post_drafts')
        .insert({
          user_id: user.id,
          content: body.content,
          privacy: body.privacy,
          tags: body.tags || [],
          mentions: body.mentions || [],
          media_urls: body.media?.map(m => m.url) || [],
          scheduled_at: body.scheduledAt,
          metadata: {
            mediaCount: body.media?.length || 0,
            mentionCount: body.mentions?.length || 0
          }
        })

      if (draftError) {
        console.error('[Posts API] Draft save error:', draftError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to save draft'
        })
      }

      return {
        success: true,
        data: {
          message: 'Post saved as draft',
          type: 'draft'
        }
      }
    }

    // ✅ Create post
    const postStatus = body.scheduledAt ? 'scheduled' : 'published'
    const publishedAt = body.scheduledAt ? null : new Date().toISOString()

    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: body.content,
        privacy: body.privacy,
        status: postStatus,
        scheduled_at: body.scheduledAt,
        published_at: publishedAt,
        metadata: {
          mediaCount: body.media?.length || 0,
          mentionCount: body.mentions?.length || 0,
          tagCount: body.tags?.length || 0
        }
      })
      .select()
      .single()

    if (postError) {
      console.error('[Posts API] Post creation error:', postError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create post'
      })
    }

    // ✅ Add media to post
    if (body.media && body.media.length > 0) {
      const mediaData = body.media.map((m, index) => ({
        post_id: postData.id,
        url: m.url,
        thumbnail_url: m.thumbnailUrl,
        type: m.type,
        mime_type: m.mimeType,
        size: m.size,
        position: index
      }))

      const { error: mediaError } = await supabase
        .from('post_media')
        .insert(mediaData)

      if (mediaError) {
        console.error('[Posts API] Media insertion error:', mediaError)
        // Continue without media rather than failing
      }
    }

    // ✅ Add tags to post
    if (body.tags && body.tags.length > 0) {
      const tagsData = body.tags.map(tag => ({
        post_id: postData.id,
        tag: tag.toLowerCase()
      }))

      const { error: tagsError } = await supabase
        .from('post_tags')
        .insert(tagsData)

      if (tagsError) {
        console.error('[Posts API] Tags insertion error:', tagsError)
      }

      // ✅ Update hashtag usage
      for (const tag of body.tags) {
        const { data: existingTag } = await supabase
          .from('hashtags')
          .select('id, usage_count')
          .eq('tag', tag.toLowerCase())
          .single()

        if (existingTag) {
          await supabase
            .from('hashtags')
            .update({
              usage_count: existingTag.usage_count + 1,
              last_used_at: new Date().toISOString()
            })
            .eq('id', existingTag.id)
        } else {
          await supabase
            .from('hashtags')
            .insert({
              tag: tag.toLowerCase(),
              usage_count: 1
            })
        }
      }
    }

    // ✅ Add mentions to post
    if (body.mentions && body.mentions.length > 0) {
      const mentionsData = body.mentions.map(mention => ({
        post_id: postData.id,
        mentioned_user_id: mention
      }))

      const { error: mentionsError } = await supabase
        .from('post_mentions')
        .insert(mentionsData)

      if (mentionsError) {
        console.error('[Posts API] Mentions insertion error:', mentionsError)
      }

      // ✅ Send notifications to mentioned users
      try {
        await sendMentionNotifications(supabase, postData.id, body.mentions, user.id)
      } catch (notifError) {
        console.error('[Posts API] Notification error:', notifError)
        // Don't fail the post creation if notifications fail
      }
    }

    // ✅ Get full post data with relations
    const { data: fullPost } = await supabase
      .from('posts')
      .select(`
        *,
        post_media (*),
        post_tags (*),
        post_mentions (*)
      `)
      .eq('id', postData.id)
      .single()

    console.log(`[Posts API] Post created: ${postData.id} by ${user.id}`)

    return {
      success: true,
      data: {
        post: fullPost,
        message: body.scheduledAt
          ? 'Post scheduled successfully'
          : 'Post published successfully',
        type: postStatus
      }
    }

  } catch (error: any) {
    console.error('[Posts API] Error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create post'
    })
  }
})

/**
 * Send mention notifications to mentioned users
 */
async function sendMentionNotifications(
  supabase: any,
  postId: string,
  mentionedUserIds: string[],
  mentionerUserId: string
) {
  // Get mentioner's profile
  const { data: mentionerProfile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', mentionerUserId)
    .single()

  // Create notifications for each mentioned user
  const notifications = mentionedUserIds.map(userId => ({
    user_id: userId,
    type: 'mention',
    title: `${mentionerProfile?.username} mentioned you`,
    message: 'You were mentioned in a post',
    related_id: postId,
    related_type: 'post',
    read: false
  }))

  await supabase
    .from('notifications')
    .insert(notifications)
            }
      
