import { getRouterParam, readBody } from 'h3'
import { logStaffAction, requireStaff } from '~/server/utils/staff'
import { loadCreatorRevenueConfig, revenueDb } from '~/server/utils/creator-revenue'
import { payoutBase, payoutTotal } from '~/server/utils/creator-payouts'

/**
 * Admin: adjust (add/reduce with a required note) or release a pending creator payout.
 * Release pays the total from the configured payout wallet as withdrawable AD_ENGAGEMENT_REVENUE, once.
 */
export default defineEventHandler(async (event) => {
  const staff = await requireStaff(event, 'admin')
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ action?: 'adjust' | 'release', adjustment?: number, note?: string }>(event)
  const db = revenueDb()
  const { data: p } = await db.from('creator_payouts').select('*').eq('id', id).maybeSingle()
  if (!p) throw createError({ statusCode: 404, statusMessage: 'Payout not found' })
  if (p.status !== 'pending') throw createError({ statusCode: 409, statusMessage: 'Payout already released' })

  if (body?.action === 'adjust') {
    const adjustment = Math.round(Number(body.adjustment) * 1e8) / 1e8
    const note = String(body.note ?? '').trim().slice(0, 1000)
    if (!Number.isFinite(adjustment)) throw createError({ statusCode: 400, statusMessage: 'Adjustment must be a number' })
    if (!note) throw createError({ statusCode: 400, statusMessage: 'A note is required for adjustments' })
    if (payoutBase(p) + adjustment < 0) throw createError({ statusCode: 400, statusMessage: 'Total cannot go below 0' })
    await db.from('creator_payouts').update({ adjustment, note }).eq('id', p.id).eq('status', 'pending')
    await logStaffAction(staff.id, 'creator_payout_adjust', 'creator_payout', p.id, { adjustment, note, creator_id: p.creator_id })
    return { ok: true, total: payoutTotal({ ...p, adjustment }) }
  }

  if (body?.action !== 'release') throw createError({ statusCode: 400, statusMessage: 'action must be adjust or release' })
  const total = payoutTotal(p)
  const cfg = await loadCreatorRevenueConfig()
  const { data: payer } = await db.from('user').select('user_id').ilike('username', cfg.payout_wallet_username || '').maybeSingle()
  if (total > 0 && !payer) throw createError({ statusCode: 400, statusMessage: 'Set a valid payout wallet on Creator revenue' })

  // Claim the row first so concurrent releases cannot pay twice.
  const now = new Date().toISOString()
  const { data: claimed } = await db.from('creator_payouts')
    .update({ status: 'released', released_amount: total, released_by: staff.id, released_at: now })
    .eq('id', p.id).eq('status', 'pending').select('id').maybeSingle()
  if (!claimed) throw createError({ statusCode: 409, statusMessage: 'Payout already released' })

  if (total > 0) {
    const { error } = await db.rpc('transfer_pewgift', {
      p_sender_id: payer!.user_id,
      p_recipient_id: p.creator_id,
      p_amount: total,
      p_debit_type: 'ADMIN_RECONCILIATION',
      p_credit_type: 'AD_ENGAGEMENT_REVENUE',
      p_reference_id: p.id,
      p_metadata: { kind: 'creator_payout', period_start: p.period_start, period_end: p.period_end, note: p.note ?? null }
    })
    if (error) {
      await db.from('creator_payouts').update({ status: 'pending', released_amount: null, released_by: null, released_at: null }).eq('id', p.id)
      throw createError({ statusCode: 400, statusMessage: `Release failed: ${error.message}` })
    }
  }
  const { data: bal } = await db.from('creator_ad_balances').select('pending_amount').eq('creator_id', p.creator_id).maybeSingle()
  if (bal) await db.from('creator_ad_balances').update({ pending_amount: Math.max(0, Number(bal.pending_amount) - payoutBase(p)), updated_at: now }).eq('creator_id', p.creator_id)
  if (total > 0) await db.from('notifications').insert({ recipient_id: p.creator_id, notifier_id: staff.id, event_type: 'SYSTEM_ALERT', source_id: p.id, message_text: `Creator earnings released: ${total} PEW was added to your wallet.` })
  await logStaffAction(staff.id, 'creator_payout_release', 'creator_payout', p.id, { total, creator_id: p.creator_id })
  return { ok: true, total }
})
