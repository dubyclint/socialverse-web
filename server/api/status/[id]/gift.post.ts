import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadVisibleStatus } from '~/server/utils/status-privacy'
import { pageWalletTransfer } from '~/server/utils/page-wallet'

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
  if (status.page_id) {
    await pageWalletTransfer({
      fromType: 'USER',
      fromId: user.id,
      toType: 'PAGE',
      toId: status.page_id,
      amount,
      debit: 'GIFT_PURCHASE',
      credit: 'GIFT_RECOVERY_REDEEM',
      operatorId: user.id,
      referenceId: status.id,
      metadata: { status_id: status.id, kind: 'status_gift' }
    })
    await db.from('status_gifts').insert({ status_id: status.id, sender_id: user.id, recipient_id: status.user_id, amount })
    await db.from('notifications').insert({
      recipient_id: status.user_id,
      recipient_page_id: status.page_id,
      notifier_id: user.id,
      event_type: 'GIFT_RECEIVED',
      source_id: status.id,
      message_text: `Your Page received ${amount} PEW on its status`,
      is_read: false
    })
    return { success: true, data: { amount } }
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
