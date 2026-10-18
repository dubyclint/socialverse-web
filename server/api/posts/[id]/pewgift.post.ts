// /server/api/posts/[id]/pewgift.post.ts
import { serverSupabaseClient } from '#supabase/server'
import { requireUser } from '~/server/utils/auth'
import { assertAllowed } from '~/server/utils/staff'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await assertAllowed(user.id, 'gift')
  const postId = getRouterParam(event, 'id')
  const { amount } = await readBody(event)
  const client = await serverSupabaseClient(event)

  try {
    // 1. Get post author to know who the receiver is
    const { data: post, error: postError } = await client
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    if (postError || !post) throw new Error('Post not found')

    // 2. Execute the atomic transaction via RPC
    // Assuming you have a function 'process_pewgift' in your DB
    const { error: rpcError } = await client.rpc('process_pewgift', {
      p_post_id: postId,
      p_sender_id: user.id,
      p_receiver_id: post.user_id,
      p_amount: amount
    })

    if (rpcError) throw rpcError

    if (post.user_id !== user.id) {
      const { data: sender } = await client.from('user').select('username').eq('user_id', user.id).maybeSingle()
      await client.from('notifications').insert({
        recipient_id: post.user_id,
        notifier_id: user.id,
        event_type: 'GIFT_RECEIVED',
        source_id: postId,
        message_text: `${sender?.username ?? 'Someone'} sent you ${amount} PEW on your post`
      })
    }

    return { success: true, message: 'Gift sent successfully' }
  } catch (err: any) {
    throw createError({ statusCode: 400, message: err.message || 'Transaction failed' })
  }
})
