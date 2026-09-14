import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { buildRepostRef, parseRepostRef } from '~/server/utils/repost'
import type { Database } from '~/types/database.types'

interface RepostRequest {
  comment?: string
}

interface RepostResponse {
  success: boolean
  data: { id: string, sharesCount: number }
}

export default defineEventHandler(async (event): Promise<RepostResponse> => {
  const user = await requireAuth(event)
  const postId = getRouterParam(event, 'id')
  if (!postId) throw createError({ statusCode: 400, statusMessage: 'Post id is required' })

  const body = await readBody<RepostRequest>(event).catch(() => ({ comment: '' }))
  const comment = (body?.comment ?? '').trim()
  if (comment.length > 5000) {
    throw createError({ statusCode: 400, statusMessage: 'Comment exceeds 5000 character limit' })
  }

  const client = await serverSupabaseClient<Database>(event)

  const { data: original, error: originalError } = await client
    .from('posts')
    .select('id, user_id, content, media_urls, hashtags, shares_count, title, privacy')
    .eq('id', postId)
    .maybeSingle()

  if (originalError) throw createError({ statusCode: 500, statusMessage: originalError.message })
  if (!original) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  if (original.privacy === 'private' && original.user_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'This post cannot be reposted' })
  }

  // Reposting a repost points at the original so the chain stays one level deep.
  const sourceId = parseRepostRef(original.title) ?? original.id

  const { data: repost, error: repostError } = await client
    .from('posts')
    .insert({
      user_id: user.id,
      content: comment,
      title: buildRepostRef(sourceId),
      privacy: 'public',
      hashtags: original.hashtags ?? [],
      media_urls: [],
      is_draft: false
    })
    .select('id')
    .single()

  if (repostError) throw createError({ statusCode: 500, statusMessage: repostError.message })

  const sharesCount = (original.shares_count ?? 0) + 1
  await Promise.all([
    client.from('posts').update({ shares_count: sharesCount }).eq('id', original.id),
    client.from('post_shares').insert({
      post_id: original.id,
      user_id: user.id,
      shared_to: 'repost'
    })
  ])

  if (original.user_id !== user.id) {
    await client.from('notifications').insert({
      recipient_id: original.user_id,
      notifier_id: user.id,
      // notification_event enum has no repost member; SYSTEM_ALERT carries the text.
      event_type: 'SYSTEM_ALERT',
      message_text: 'Your post was reposted',
      source_id: original.id
    })
  }

  return { success: true, data: { id: repost.id, sharesCount } }
})
