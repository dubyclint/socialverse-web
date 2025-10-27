// server/api/posts/[id]/share.post.ts
// ============================================================================
// SHARE POST ENDPOINT
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface SharePostRequest {
  platform: 'twitter' | 'facebook' | 'whatsapp' | 'copy' | 'email'
  email?: string
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const postId = getRouterParam(event, 'id')
    const body = await readBody<SharePostRequest>(event)

    const supabase = await serverSupabaseClient(event)

    // Record share
    const { error: shareError } = await supabase
      .from('post_shares')
      .insert({
        post_id: postId,
        user_id: user.id,
        shared_to: body.platform
      })

    if (shareError && !shareError.message.includes('duplicate')) {
      throw shareError
    }

    // Update analytics
    await supabase.rpc('update_post_analytics', { post_id_param: postId })

    // Get post data for sharing
    const { data: post } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()

    const { data: author } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', post.user_id)
      .single()

    const shareUrl = `${process.env.NUXT_PUBLIC_SITE_URL}/posts/${postId}`
    const shareText = `Check out this post by @${author?.username}: ${post.content.substring(0, 100)}...`

    // Generate share links
    const shareLinks: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      copy: shareUrl,
      email: `mailto:?subject=Check out this post&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`
    }

    return {
      success: true,
      data: {
        platform: body.platform,
        shareUrl: shareLinks[body.platform],
        message: 'Post shared successfully'
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to share post'
    })
  }
})
      
