import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

const REASONS = ['spam', 'harassment', 'nudity', 'violence', 'misinformation', 'other'] as const
type ReportReason = typeof REASONS[number]

interface ReportPostRequest {
  reason?: ReportReason
  description?: string
}

interface ReportPostResponse {
  success: boolean
  message: string
}

export default defineEventHandler(async (event): Promise<ReportPostResponse> => {
  const user = await requireAuth(event)
  const postId = getRouterParam(event, 'id')
  if (!postId) throw createError({ statusCode: 400, statusMessage: 'Post ID is required' })

  const body = await readBody<ReportPostRequest>(event)
  const reason: ReportReason = body?.reason && REASONS.includes(body.reason) ? body.reason : 'other'

  const client = await serverSupabaseClient<Database>(event)

  const { data: post, error: postError } = await client
    .from('posts')
    .select('id, user_id')
    .eq('id', postId)
    .maybeSingle()

  if (postError) throw createError({ statusCode: 500, statusMessage: postError.message })
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })

  const { data: existing } = await client
    .from('reports')
    .select('id')
    .eq('post_id', postId)
    .eq('reporter_id', user.id)
    .maybeSingle()

  if (existing) return { success: true, message: 'You already reported this post' }

  const { error } = await client.from('reports').insert({
    post_id: postId,
    reporter_id: user.id,
    reported_user_id: post.user_id,
    reason,
    description: body?.description?.slice(0, 500) ?? null,
    status: 'pending'
  })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true, message: 'Report submitted' }
})
