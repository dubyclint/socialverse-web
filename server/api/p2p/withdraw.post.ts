import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireAmount, requireUuid } from '~/server/utils/input'
import { enforceRateLimit } from '~/server/utils/rate-limit'

/** P2P withdrawal: the fee comes off first, the PEW is held in escrow and the seller pays the user's account. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{ listingId?: string, amount?: number, payout?: { name?: string, account?: string, bank?: string, note?: string } }>(event)
  const listingId = requireUuid(body.listingId, 'listingId')
  const amount = requireAmount(body.amount, 'amount')
  const payout = {
    name: String(body.payout?.name ?? '').trim().slice(0, 120),
    account: String(body.payout?.account ?? '').trim().slice(0, 120),
    bank: String(body.payout?.bank ?? '').trim().slice(0, 120),
    note: String(body.payout?.note ?? '').trim().slice(0, 300)
  }
  if (!payout.name || !payout.account) throw createError({ statusCode: 400, statusMessage: 'Enter the account name and number the seller should pay' })
  await enforceRateLimit(event, 'p2p:withdraw', { limit: 10, windowMs: 60_000 }, user.id)

  const db = getServiceClient()
  const { data: tradeId, error } = await db.rpc('open_p2p_withdraw' as never, { p_listing_id: listingId, p_user_id: user.id, p_amount: amount, p_payout: payout } as never)
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  const { data: trade } = await db.from('p2p_trades').select('*').eq('id', tradeId as unknown as string).single()
  return { trade }
})
