import { getQuery } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireStaff } from '~/server/utils/staff'

/** Search accounts, or list restricted/banned ones, for the compliance screen. */
export default defineEventHandler(async (event) => {
  await requireStaff(event, 'compliance')
  const q = String(getQuery(event).q ?? '').trim().replace(/[%,()]/g, '')
  const service = getServiceClient()
  const columns = 'user_id, username, display_name, email, avatar_url, role, is_banned, banned_until, ban_reason, restrictions, created_at'
  const query = q.length >= 2
    ? service.from('user').select(columns).or(`username.ilike.%${q}%,display_name.ilike.%${q}%,email.ilike.%${q}%`).limit(25)
    : service.from('user').select(columns).or('is_banned.eq.true,restrictions.neq.{}').order('updated_at', { ascending: false }).limit(100)
  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const { data: wallets } = (data ?? []).length
    ? await service.from('wallets').select('user_id, balance').in('user_id', (data ?? []).map(u => u.user_id))
    : { data: [] }
  const balances = new Map((wallets ?? []).map(w => [w.user_id, Number(w.balance ?? 0)]))
  return { users: (data ?? []).map(u => ({ ...u, wallet_balance: balances.get(u.user_id) ?? 0 })) }
})
