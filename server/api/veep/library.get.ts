import { getQuery } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'

/** The caller's Veep library: watched (default), liked, saved, shared. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const raw = String(getQuery(event).kind ?? 'watched')
  const kind = ['watched', 'liked', 'saved', 'shared'].includes(raw) ? raw : 'watched'
  const db = getServiceClient()
  const { data: rows } = await db.from('veep_library' as never).select('post_id, created_at').eq('user_id', user.id).eq('kind', kind).order('created_at', { ascending: false }).limit(60)
  const ids = ((rows ?? []) as { post_id: string }[]).map(r => r.post_id)
  if (!ids.length) return { items: [] }
  const { data: posts } = await db.from('posts').select('id, media_urls, content, views_count' as never).in('id', ids)
  const byId = new Map(((posts ?? []) as unknown as { id: string, media_urls: string[] | null, content: string | null, views_count: number }[]).map(p => [p.id, p]))
  return { items: ids.map(id => byId.get(id)).filter(Boolean) }
})
