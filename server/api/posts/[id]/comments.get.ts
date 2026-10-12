import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export interface PostCommentView {
  id: string
  postId: string
  parentId: string | null
  content: string
  createdAt: string
  editedAt: string | null
  author: {
    id: string
    username: string
    name: string
    avatar: string | null
    type: 'USER' | 'PAGE'
  }
}

export default defineEventHandler(async (event): Promise<{ success: boolean, data: PostCommentView[] }> => {
  const postId = getRouterParam(event, 'id')
  if (!postId) throw createError({ statusCode: 400, statusMessage: 'Post id is required' })

  const query = getQuery(event)
  const limit = Math.min(50, Math.max(1, Number.parseInt(String(query.limit ?? '20'), 10) || 20))
  const offset = Math.max(0, Number.parseInt(String(query.offset ?? '0'), 10) || 0)

  const client = await serverSupabaseClient<Database>(event)

  const { data: comments, error } = await client
    .from('post_comments')
    .select('id, post_id, parent_id, comment_text, created_at, edited_at, user_id, page_id')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const authorIds = Array.from(new Set((comments ?? []).map(row => row.user_id)))
  const { data: authors } = authorIds.length
    ? await client
        .from('user')
        .select('user_id, username, display_name, full_name, avatar_url')
        .in('user_id', authorIds)
    : { data: [] }

  const authorById = new Map((authors ?? []).map(row => [row.user_id, row]))
  const pageIds = Array.from(new Set((comments ?? []).map(row => row.page_id).filter((id): id is string => Boolean(id))))
  const { data: pages } = pageIds.length
    ? await client.from('pages').select('id, handle, name, avatar_url').in('id', pageIds)
    : { data: [] }
  const pageById = new Map((pages ?? []).map(row => [row.id, row]))

  return {
    success: true,
    data: (comments ?? []).map((row) => {
      const author = authorById.get(row.user_id)
      const page = row.page_id ? pageById.get(row.page_id) : undefined
      return {
        id: row.id,
        postId: row.post_id,
        parentId: row.parent_id,
        content: row.comment_text,
        createdAt: row.created_at,
        editedAt: row.edited_at,
        author: page
          ? { id: page.id, username: page.handle, name: page.name, avatar: page.avatar_url, type: 'PAGE' as const }
          : {
              id: row.user_id,
              username: author?.username ?? 'unknown',
              name: author?.full_name || author?.display_name || author?.username || 'Unknown user',
              avatar: author?.avatar_url ?? null,
              type: 'USER' as const
            }
      }
    })
  }
})
