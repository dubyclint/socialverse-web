import type { getServiceClient } from '~/server/utils/supabase-admin'

type Db = ReturnType<typeof getServiceClient>

/** Applies the author's "Status" privacy: everyone, PALs only ('contacts', the default) or nobody. */
export const canSeeStatus = async (db: Db, viewerId: string, authorId: string): Promise<boolean> => {
  if (viewerId === authorId) return true
  const { data: pref } = await db.from('user_settings').select('privacy').eq('user_id', authorId).maybeSingle()
  const visibility = (pref?.privacy as { status?: string } | null)?.status ?? 'contacts'
  if (visibility === 'everyone') return true
  if (visibility === 'nobody') return false
  const { data: pal } = await db.from('pals').select('user_id')
    .eq('status', 'accepted')
    .or(`and(user_id.eq.${viewerId},pal_id.eq.${authorId}),and(user_id.eq.${authorId},pal_id.eq.${viewerId})`)
    .limit(1)
  return Boolean(pal?.length)
}

/** Loads an active status the viewer is allowed to see, or throws 404. */
export const loadVisibleStatus = async (db: Db, viewerId: string, id: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
  const { data: status } = await db.from('user_statuses').select('id, user_id')
    .eq('id', id).is('deleted_at', null).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!status || !await canSeeStatus(db, viewerId, status.user_id)) {
    throw createError({ statusCode: 404, statusMessage: 'This status has expired' })
  }
  return status
}

export const loadPeople = async (db: Db, ids: string[]) => {
  if (!ids.length) return new Map<string, { id: string, name: string, username: string, avatar_url: string | null }>()
  const { data } = await db.from('user').select('user_id, username, full_name, display_name, avatar_url').in('user_id', [...new Set(ids)])
  return new Map((data ?? []).map(p => [p.user_id, {
    id: p.user_id,
    name: p.full_name || p.display_name || p.username || 'User',
    username: p.username || 'user',
    avatar_url: p.avatar_url
  }]))
}
