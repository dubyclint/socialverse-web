import { requireStaff } from '~/server/utils/staff'
import { revenueDb } from '~/server/utils/creator-revenue'

/** Admin: users awarded monetization by an admin (bypassing the automatic requirements). */
export default defineEventHandler(async (event) => {
  await requireStaff(event, 'admin')
  const db = revenueDb()
  const { data: rows } = await db.from('user_overrides').select('user_id, created_at, expires_at').eq('override_type', 'monetization').eq('key', 'award').order('created_at', { ascending: false }).limit(200)
  const ids = (rows ?? []).map(r => r.user_id)
  const { data: users } = ids.length ? await db.from('user').select('user_id, username, display_name').in('user_id', ids) : { data: [] }
  const byId = new Map(((users ?? []) as { user_id: string, username: string, display_name: string | null }[]).map(u => [u.user_id, u]))
  return { awards: (rows ?? []).map(r => ({ ...r, username: byId.get(r.user_id)?.username ?? '', name: byId.get(r.user_id)?.display_name ?? '' })) }
})
