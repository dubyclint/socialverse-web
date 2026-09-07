import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 50, 100)
  const offset = Number(query.offset) || 0

  const supabase = await serverSupabaseClient<Database>(event)

  let q = supabase
    .from('universe_messages')
    .select('id, user_id, content, country, interest, language, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (query.country) q = q.eq('country', String(query.country))
  if (query.interest) q = q.eq('interest', String(query.interest))
  if (query.language) q = q.eq('language', String(query.language))

  const { data: messages, error } = await q
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const rows = messages ?? []
  const authorIds = [...new Set(rows.map(m => m.user_id))]

  const { data: authors } = authorIds.length
    ? await supabase
        .from('user')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', authorIds)
    : { data: [] }

  const byId = new Map((authors ?? []).map(a => [a.user_id, a]))

  return {
    success: true,
    data: rows
      .map(m => {
        const author = byId.get(m.user_id)
        return {
          ...m,
          username: author?.display_name || author?.username || 'unknown',
          avatar: author?.avatar_url || undefined
        }
      })
      .reverse(),
    hasMore: rows.length === limit
  }
})
