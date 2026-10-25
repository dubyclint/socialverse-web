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
