import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadVisibleStatus } from '~/server/utils/status-privacy'

/** Gifts PEW to a status author from the viewer's wallet (gift fee applies to the recipient). */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = getServiceClient()
  const status = await loadVisibleStatus(db, user.id, getRouterParam(event, 'id') ?? '')
  if (status.user_id === user.id) throw createError({ statusCode: 400, statusMessage: 'You cannot gift your own status' })
  const amount = Math.round(Number((await readBody<{ amount?: number }>(event))?.amount) * 10000) / 10000
  if (!Number.isFinite(amount) || amount < 0.01 || amount > 1000) {
    throw createError({ statusCode: 400, statusMessage: 'Gift between 0.01 and 1000 PEW' })
  }
  const { error } = await db.rpc('transfer_pewgift' as never, {
    p_sender_id: user.id,
    p_recipient_id: status.user_id,
    p_amount: amount,
    p_debit_type: 'P2P_TIPPING_SENT',
    p_credit_type: 'GIFT_RECOVERY_REDEEM',
    p_reference_id: status.id,
    p_metadata: { status_id: status.id, kind: 'status_gift' }
  } as never)
  if (error) {
    const insufficient = /insufficient/i.test(error.message)
    throw createError({ statusCode: insufficient ? 402 : 500, statusMessage: insufficient ? 'Not enough PEW in your wallet' : 'Gift failed' })
  }
  await db.from('status_gifts').insert({ status_id: status.id, sender_id: user.id, recipient_id: status.user_id, amount })
  return { success: true, data: { amount } }
})
