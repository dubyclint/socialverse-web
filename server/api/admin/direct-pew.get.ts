import { getServiceClient } from '~/server/utils/supabase-admin'
import { getDirectPewWarning, requireWalletAdmin } from '~/server/utils/wallet'

/** Direct PEW-balance withdrawal: the global warning text and every per-user limit. */
export default defineEventHandler(async (event) => {
  await requireWalletAdmin(event)
  const db = getServiceClient()
  const [warning, { data: rows }] = await Promise.all([
    getDirectPewWarning(),
    db.from('direct_pew_limits' as never).select('user_id, limit_pew, updated_at').order('updated_at', { ascending: false }).limit(500)
  ])
  const list = (rows ?? []) as { user_id: string, limit_pew: number, updated_at: string }[]
  const { data: users } = list.length
    ? await db.from('user').select('user_id, username').in('user_id', list.map(r => r.user_id))
    : { data: [] }
  const names = new Map((users ?? []).map(u => [u.user_id, u.username]))
  return { warning, limits: list.map(r => ({ ...r, limit_pew: Number(r.limit_pew), username: names.get(r.user_id) ?? null })) }
})
