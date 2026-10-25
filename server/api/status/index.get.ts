import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'

export interface StatusItem {
  id: string
  content: string | null
  media_url: string | null
  media_type: 'text' | 'image' | 'video'
  background_color: string | null
  text_color: string | null
  created_at: string
  expires_at: string | null
  viewed: boolean
  view_count?: number
}

export interface StatusGroup {
  author: { id: string, username: string, full_name: string, avatar_url: string | null, verified: boolean, verified_type: string | null }
  is_me: boolean
  all_viewed: boolean
  statuses: StatusItem[]
}

const mediaType = (url: string | null): StatusItem['media_type'] => {
  if (!url) return 'text'
  return /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(url) ? 'video' : 'image'
}

/** Active (24h) statuses from the viewer, the people they follow and their PALs, grouped by author. */
export default defineEventHandler(async (event): Promise<{ success: true, data: StatusGroup[] }> => {
  const user = await requireUser(event)
  const db = getServiceClient()

  const [{ data: follows }, { data: pals }] = await Promise.all([
    db.from('follows').select('following_id').eq('follower_id', user.id),
    db.from('pals').select('user_id, pal_id').or(`user_id.eq.${user.id},pal_id.eq.${user.id}`).eq('status', 'accepted')
  ])
  const authorIds = new Set<string>([user.id])
  for (const f of follows ?? []) authorIds.add(f.following_id)
  for (const p of pals ?? []) authorIds.add(p.user_id === user.id ? p.pal_id : p.user_id)

  const { data: rows, error } = await db
    .from('user_statuses')
    .select('id, user_id, content, caption, media_url, background_color, text_color, created_at, expires_at, view_count')
    .in('user_id', [...authorIds])
    .is('deleted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(500)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!rows?.length) return { success: true, data: [] }

  const ids = rows.map(r => r.id)
  const [{ data: views }, { data: people }] = await Promise.all([
    db.from('status_views').select('status_id').eq('viewer_id', user.id).in('status_id', ids),
    db.from('user').select('user_id, username, display_name, full_name, avatar_url, is_verified, verified_type').in('user_id', [...new Set(rows.map(r => r.user_id))])
  ])
  const viewed = new Set((views ?? []).map(v => v.status_id))
  const personById = new Map((people ?? []).map(p => [p.user_id, p]))

  const groups = new Map<string, StatusGroup>()
  for (const row of rows) {
    const person = personById.get(row.user_id)
    if (!person) continue
    const isMe = row.user_id === user.id
    let group = groups.get(row.user_id)
    if (!group) {
      group = {
        author: {
          id: person.user_id,
          username: person.username || 'user',
          full_name: person.full_name || person.display_name || person.username || 'User',
          avatar_url: person.avatar_url,
          verified: person.is_verified === true,
          verified_type: person.verified_type
        },
        is_me: isMe,
        all_viewed: true,
        statuses: []
      }
      groups.set(row.user_id, group)
    }
    const seen = isMe || viewed.has(row.id)
    if (!seen) group.all_viewed = false
    group.statuses.push({
      id: row.id,
      content: row.content ?? row.caption,
      media_url: row.media_url,
      media_type: mediaType(row.media_url),
      background_color: row.background_color,
      text_color: row.text_color,
      created_at: row.created_at,
      expires_at: row.expires_at,
      viewed: seen,
      ...(isMe ? { view_count: row.view_count ?? 0 } : {})
    })
  }

  const list = [...groups.values()]
  list.sort((a, b) => {
    if (a.is_me !== b.is_me) return a.is_me ? -1 : 1
    if (a.all_viewed !== b.all_viewed) return a.all_viewed ? 1 : -1
    return b.statuses.at(-1)!.created_at.localeCompare(a.statuses.at(-1)!.created_at)
  })
  return { success: true, data: list }
})
