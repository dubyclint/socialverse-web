import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadPeople } from '~/server/utils/status-privacy'

/** The viewer's own active statuses with views, likes, comments and gifts. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = getServiceClient()
  const { data: rows, error } = await db.from('user_statuses')
    .select('id, content, caption, media_url, background_color, text_color, created_at, expires_at, view_count')
    .eq('user_id', user.id).is('deleted_at', null).gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not load your statuses' })
  const ids = (rows ?? []).map(r => r.id)
  if (!ids.length) return { success: true, data: [] }

  const [{ data: views }, { data: likes }, { data: comments }, { data: gifts }] = await Promise.all([
    db.from('status_views').select('status_id, viewer_id, viewed_at').in('status_id', ids),
    db.from('status_likes').select('status_id, user_id, created_at').in('status_id', ids),
    db.from('status_comments').select('id, status_id, user_id, content, created_at').in('status_id', ids).order('created_at'),
    db.from('status_gifts').select('id, status_id, sender_id, amount, created_at').in('status_id', ids).order('created_at')
  ])
  const people = await loadPeople(db, [
    ...(views ?? []).map(v => v.viewer_id), ...(likes ?? []).map(l => l.user_id),
    ...(comments ?? []).map(c => c.user_id), ...(gifts ?? []).map(g => g.sender_id)
  ])
  const who = (id: string) => people.get(id) ?? { id, name: 'User', username: 'user', avatar_url: null }

  return {
    success: true,
    data: (rows ?? []).map(r => ({
      id: r.id,
      content: r.content ?? r.caption,
      media_url: r.media_url,
      media_type: !r.media_url ? 'text' : /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(r.media_url) ? 'video' : 'image',
      background_color: r.background_color,
      text_color: r.text_color,
      created_at: r.created_at,
      expires_at: r.expires_at,
      views: (views ?? []).filter(v => v.status_id === r.id).map(v => ({ user: who(v.viewer_id), at: v.viewed_at })),
      likes: (likes ?? []).filter(l => l.status_id === r.id).map(l => ({ user: who(l.user_id), at: l.created_at })),
      comments: (comments ?? []).filter(c => c.status_id === r.id).map(c => ({ id: c.id, user: who(c.user_id), content: c.content, at: c.created_at })),
      gifts: (gifts ?? []).filter(g => g.status_id === r.id).map(g => ({ id: g.id, user: who(g.sender_id), amount: Number(g.amount), at: g.created_at }))
    }))
  }
})
