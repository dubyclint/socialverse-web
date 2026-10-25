import type { getServiceClient } from '~/server/utils/supabase-admin'
import { DEFAULT_USER_SETTINGS, type PrivacySettings } from '~/shared/user-settings'

type Db = ReturnType<typeof getServiceClient>
export type PrivacyField = 'lastSeen' | 'profilePhoto' | 'about'

const UUID = /^[0-9a-f-]{36}$/i

/** Saved privacy settings per user, merged over the defaults. */
export const loadPrivacy = async (db: Db, ids: string[]): Promise<Map<string, PrivacySettings>> => {
  const unique = [...new Set(ids)].filter(id => id && UUID.test(id))
  const map = new Map<string, PrivacySettings>()
  if (!unique.length) return map
  const { data } = await db.from('user_settings').select('user_id, privacy').in('user_id', unique)
  for (const id of unique) map.set(id, { ...DEFAULT_USER_SETTINGS.privacy })
  for (const row of data ?? []) {
    map.set(row.user_id, { ...DEFAULT_USER_SETTINGS.privacy, ...((row.privacy ?? {}) as Partial<PrivacySettings>) } as PrivacySettings)
  }
  return map
}

const loadPalIds = async (db: Db, viewerId: string, ids: string[]): Promise<Set<string>> => {
  if (!ids.length) return new Set()
  const list = ids.join(',')
  const { data } = await db.from('pals').select('user_id, pal_id')
    .eq('status', 'accepted')
    .or(`and(user_id.eq.${viewerId},pal_id.in.(${list})),and(pal_id.eq.${viewerId},user_id.in.(${list}))`)
  return new Set((data ?? []).map(row => (row.user_id === viewerId ? row.pal_id : row.user_id)))
}

/**
 * Returns a checker for "can the viewer see this owner's <field>?", applying
 * each owner's Everyone / My PALs / Nobody choice. Owners always see their own.
 */
export const privacyGate = async (db: Db, viewerId: string, ownerIds: string[]) => {
  const others = [...new Set(ownerIds)].filter(id => id && id !== viewerId && UUID.test(id))
  const [prefs, pals] = await Promise.all([loadPrivacy(db, others), loadPalIds(db, viewerId, others)])
  return (ownerId: string | null | undefined, field: PrivacyField): boolean => {
    if (!ownerId || ownerId === viewerId) return true
    const level = prefs.get(ownerId)?.[field] ?? DEFAULT_USER_SETTINGS.privacy[field]
    if (level === 'everyone') return true
    if (level === 'nobody') return false
    return pals.has(ownerId)
  }
}

export const readReceiptsOn = async (db: Db, userId: string): Promise<boolean> =>
  (await loadPrivacy(db, [userId])).get(userId)?.readReceipts !== false
