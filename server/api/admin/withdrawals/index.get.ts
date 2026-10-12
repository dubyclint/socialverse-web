import { getQuery } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireWalletAdmin } from '~/server/utils/wallet'

export default defineEventHandler(async (event) => {
  await requireWalletAdmin(event)
  const status = String(getQuery(event).status ?? 'open')
  const service = getServiceClient()

  let query = service.from('withdrawals')
    .select('id, user_id, amount, status, method, details, fee_pewgift, tax_pewgift, payout_usd, admin_note, created_at, processed_at')
    .order('created_at', { ascending: false })
    .limit(200)
  query = status === 'open' ? query.in('status', ['pending', 'processing']) : query.eq('status', status)

  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const ids = [...new Set((data ?? []).map(w => w.user_id).filter((id): id is string => !!id))]
  const { data: people } = ids.length
    ? await service.from('user').select('user_id, username').in('user_id', ids)
    : { data: [] }
  const names = new Map((people ?? []).map(p => [p.user_id, p.username]))
  return { items: (data ?? []).map(w => ({ ...w, username: w.user_id ? names.get(w.user_id) ?? null : null })) }
})
