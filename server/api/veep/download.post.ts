import { readBody } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireUuid } from '~/server/utils/input'

/** Post owner turns viewer downloads on or off for their veep. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<{ postId?: string, allow?: boolean }>(event)
  const postId = requireUuid(body?.postId, 'postId')
  const db = getServiceClient()
  const { data: post } = await db.from('posts').select('user_id').eq('id', postId).maybeSingle()
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  if (post.user_id !== user.id) throw createError({ statusCode: 403, statusMessage: 'Only the owner can change downloads' })
  const allow = body?.allow !== false
  const { error } = await db.from('posts').update({ allow_download: allow } as never).eq('id', postId)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { allow_download: allow }
})
