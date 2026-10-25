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
  liked: boolean
  like_count: number
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

/** Active statuses from the viewer, their PALs and people they were matched with, grouped by author. */
export default defineEventHandler(async (event): Promise<{ success: true, data: StatusGroup[] }> => {
  const user = await requireUser(event)
  const db = getServiceClient()

  const { data: myMatches } = await db.from('stream_match_participants').select('match_id').eq('user_id', user.id).limit(200)
  const matchIds = [...new Set((myMatches ?? []).map(m => m.match_id))]
  const [{ data: matched }, { data: pals }] = await Promise.all([
    matchIds.length
      ? db.from('stream_match_participants').select('user_id').in('match_id', matchIds).neq('user_id', user.id)
      : Promise.resolve({ data: [] as { user_id: string }[] }),
    db.from('pals').select('user_id, pal_id').or(`user_id.eq.${user.id},pal_id.eq.${user.id}`).eq('status', 'accepted')
  ])
  const authorIds = new Set<string>([user.id])
  const palIds = new Set<string>()
  for (const m of matched ?? []) authorIds.add(m.user_id)
  for (const p of pals ?? []) {
    const other = p.user_id === user.id ? p.pal_id : p.user_id
    authorIds.add(other)
    palIds.add(other)
  }

  // Respect each author's "Status" privacy: everyone, PALs only (contacts) or nobody.
  const others = [...authorIds].filter(id => id !== user.id)
  if (others.length) {
    const { data: prefs } = await db.from('user_settings').select('user_id, privacy').in('user_id', others)
    for (const pref of prefs ?? []) {
      const visibility = (pref.privacy as { status?: string } | null)?.status ?? 'contacts'
      if (visibility === 'nobody' || (visibility === 'contacts' && !palIds.has(pref.user_id))) authorIds.delete(pref.user_id)
    }
    // No saved settings means the default ('contacts'): PALs only.
    const withPrefs = new Set((prefs ?? []).map(p => p.user_id))
    for (const id of others) if (!withPrefs.has(id) && !palIds.has(id)) authorIds.delete(id)
  }

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
  const [{ data: views }, { data: people }, { data: likes }] = await Promise.all([
    db.from('status_views').select('status_id').eq('viewer_id', user.id).in('status_id', ids),
    db.from('user').select('user_id, username, display_name, full_name, avatar_url, is_verified, verified_type').in('user_id', [...new Set(rows.map(r => r.user_id))]),
    db.from('status_likes').select('status_id, user_id').in('status_id', ids)
  ])
  const likeCount = new Map<string, number>()
  const likedByMe = new Set<string>()
  for (const l of likes ?? []) {
    likeCount.set(l.status_id, (likeCount.get(l.status_id) ?? 0) + 1)
    if (l.user_id === user.id) likedByMe.add(l.status_id)
  }
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
      liked: likedByMe.has(row.id),
      like_count: likeCount.get(row.id) ?? 0,
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
