import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireStaff } from '~/server/utils/staff'

const count = async (query: PromiseLike<{ count: number | null }>) => (await query).count ?? 0

/** Platform metrics for the control dashboard. */
export default defineEventHandler(async (event) => {
  await requireStaff(event, 'metrics')
  const s = getServiceClient()
  const day = new Date(Date.now() - 86400_000).toISOString()
  const week = new Date(Date.now() - 7 * 86400_000).toISOString()
  const head = { count: 'exact' as const, head: true }

  const [
    users, users7d, verified, banned, online, posts, posts24h, comments24h, messages24h,
    pages, activeAds, pendingAds, openReports, pendingBadges, pendingWithdrawals, liveStreams
  ] = await Promise.all([
    count(s.from('user').select('user_id', head)),
    count(s.from('user').select('user_id', head).gte('created_at', week)),
    count(s.from('user').select('user_id', head).eq('is_verified', true)),
    count(s.from('user').select('user_id', head).eq('is_banned', true)),
    count(s.from('user').select('user_id', head).gte('last_seen', new Date(Date.now() - 5 * 60_000).toISOString())),
    count(s.from('posts').select('id', head)),
    count(s.from('posts').select('id', head).gte('created_at', day)),
    count(s.from('comments').select('id', head).gte('created_at', day)),
    count(s.from('chat_messages').select('id', head).gte('created_at', day)),
    count(s.from('pages').select('id', head)),
    count(s.from('ads_campaigns').select('id', head).eq('status', 'ACTIVE')),
    count(s.from('ads_campaigns').select('id', head).eq('status', 'PENDING_REVIEW')),
    count(s.from('reports').select('id', head).eq('status', 'pending')),
    count(s.from('badge_requests').select('id', head).eq('status', 'pending')),
    count(s.from('withdrawals').select('id', head).in('status', ['pending', 'processing'])),
    count(s.from('streams').select('id', head).eq('broadcast_status', 'LIVE'))
  ])

  const [{ data: deposits }, { data: wallets }, { data: fees }, { data: payouts }] = await Promise.all([
    s.from('deposits').select('credited_pewgift, fee_pewgift').eq('status', 'SETTLED').gte('created_at', week),
    s.from('wallets').select('balance'),
    s.from('wallet_ledger').select('amount, transaction_type').in('transaction_type', ['DEPOSIT_FEE', 'GIFT_FEE']).gte('created_at', week),
    s.from('withdrawals').select('fee_pewgift').eq('status', 'successful').gte('created_at', week)
  ])
  const sum = (rows: { [k: string]: unknown }[] | null, key: string) =>
    Number((rows ?? []).reduce((t, r) => t + Math.abs(Number(r[key] ?? 0)), 0).toFixed(4))

  return {
    users: { total: users, new7d: users7d, verified, banned, onlineNow: online },
    content: { posts, posts24h, comments24h, messages24h, pages, liveStreams },
    money: { pewInWallets: sum(wallets, 'balance'), deposits7d: sum(deposits, 'credited_pewgift'), feesEarned7d: Number((sum(fees, 'amount') + sum(payouts, 'fee_pewgift')).toFixed(4)) },
    queues: { pendingAds, activeAds, openReports, pendingBadges, pendingWithdrawals }
  }
})
