// /server/api/posts/[id]/pewgift.post.ts
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

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

    return { success: true, message: 'Gift sent successfully' }
  } catch (err: any) {
    throw createError({ statusCode: 400, message: err.message || 'Transaction failed' })
  }
})
