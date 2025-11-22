// server/api/pewgift/send-to-post.post.ts
// ============================================================================
// SEND GIFT TO POST
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface SendGiftRequest {
  postId: string
  giftTypeId: string
  quantity: number
  message?: string
  isAnonymous: boolean
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const body = await readBody<SendGiftRequest>(event)

    if (!body.postId || !body.giftTypeId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Post ID and gift type ID are required'
      })
    }

    const supabase = await serverSupabaseClient(event)

    // Call the function to send gift
    const { data, error } = await supabase
      .rpc('send_gift_to_post', {
        sender_id_param: user.id,
        post_id_param: body.postId,
        gift_type_id_param: body.giftTypeId,
        quantity_param: body.quantity || 1,
        message_param: body.message || null,
        is_anonymous_param: body.isAnonymous || false
      })

    if (error) {
      console.error('[PewGift API] Error:', error)
      throw createError({
        statusCode: 400,
        statusMessage: data?.[0]?.message || 'Failed to send gift'
      })
    }

    const result = data?.[0]
    if (!result?.success) {
      throw createError({
        statusCode: 400,
        statusMessage: result?.message || 'Failed to send gift'
      })
    }

    // Get post author for notification
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', body.postId)
      .single()

    // Send notification
    if (post && post.user_id !== user.id) {
      const { data: giftType } = await supabase
        .from('pewgift_types')
        .select('name, emoji')
        .eq('id', body.giftTypeId)
        .single()

      const { data: sender } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      await supabase
        .from('notifications')
        .insert({
          user_id: post.user_id,
          type: 'gift',
          title: `${body.isAnonymous ? 'Someone' : sender?.username} sent you a ${giftType?.emoji} ${giftType?.name}`,
          message: `You received a gift on your post`,
          related_id: body.postId,
          related_type: 'post'
        })
    }

    return {
      success: true,
      data: {
        newBalance: result.new_balance,
        message: 'Gift sent successfully'
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to send gift'
    })
  }
})
          
