import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

type PostRow = Database['public']['Tables']['posts']['Row']
type PostUpdate = Database['public']['Tables']['posts']['Update']

interface UpdatePostRequest {
  content?: string
  privacy?: 'public' | 'friends' | 'private'
  tags?: string[]
}

interface UpdatePostResponse {
  success: boolean
  data: PostRow
  message: string
}

export default defineEventHandler(async (event): Promise<UpdatePostResponse> => {
  const user = await requireAuth(event)
  const postId = getRouterParam(event, 'id')
  if (!postId) throw createError({ statusCode: 400, statusMessage: 'Post ID is required' })

  const client = await serverSupabaseClient<Database>(event)

  const { data: post, error: postError } = await client
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .maybeSingle()

  if (postError) throw createError({ statusCode: 500, statusMessage: postError.message })
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  if (post.user_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'You can only edit your own posts' })
  }

  const body = await readBody<UpdatePostRequest>(event)
  const updates: PostUpdate = { updated_at: new Date().toISOString() }

  if (body.content !== undefined) {
    const content = body.content.trim()
    if (!content) throw createError({ statusCode: 400, statusMessage: 'Post content cannot be empty' })
    if (content.length > 5000) {
      throw createError({ statusCode: 400, statusMessage: 'Post content exceeds 5000 character limit' })
    }
    updates.content = content
  }

  if (body.privacy !== undefined) {
    if (!['public', 'friends', 'private'].includes(body.privacy)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid privacy setting' })
    }
    updates.privacy = body.privacy
  }

  if (body.tags !== undefined) updates.hashtags = body.tags

  const { data: updatedPost, error: updateError } = await client
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .select()
    .single()

  if (updateError) throw createError({ statusCode: 500, statusMessage: updateError.message })

  return { success: true, data: updatedPost, message: 'Post updated successfully' }
})
