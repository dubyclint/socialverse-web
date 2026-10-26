import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { getStaffAccess } from '~/server/utils/staff-access'

/** Final dispute decision by an admin, manager, P2P admin, dispute decider or support manager. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ action?: 'release' | 'cancel', note?: string }>(event)
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Trade id is required' })
  if (body?.action !== 'release' && body?.action !== 'cancel') throw createError({ statusCode: 400, statusMessage: 'action must be release or cancel' })
  const note = (body.note ?? '').trim().slice(0, 1000)
  if (!note) throw createError({ statusCode: 400, statusMessage: 'Write the reason for the decision' })

  const access = await getStaffAccess(user.id)
  if (!access.canDecideDisputes) throw createError({ statusCode: 403, statusMessage: 'Dispute decider access required' })

  const db = getServiceClient()
  const { data: trade } = await db.from('p2p_trades').select('id, status, support_ticket_id').eq('id', id).maybeSingle()
  if (!trade) throw createError({ statusCode: 404, statusMessage: 'Trade not found' })
  if (trade.status !== 'disputed') throw createError({ statusCode: 400, statusMessage: 'Only disputed trades are decided here' })

  const rpc = body.action === 'release' ? 'release_p2p_trade' : 'cancel_p2p_trade'
  const args = body.action === 'release' ? { p_trade_id: id, p_actor_id: user.id } : { p_trade_id: id, p_actor_id: user.id, p_reason: note }
  const { error } = await db.rpc(rpc as never, args as never)
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })

  await db.from('p2p_trades').update({ decided_by: user.id, decision_note: note } as never).eq('id', id)
  const ticketId = (trade as { support_ticket_id?: string | null }).support_ticket_id
  if (ticketId) {
    const now = new Date().toISOString()
    await db.from('support_messages' as never).insert({ ticket_id: ticketId, sender_id: user.id, is_staff: true, is_system: true,
      body: `Final decision: escrow ${body.action === 'release' ? 'released to the buyer' : 'returned to the seller'}. ${note}` } as never)
    await db.from('support_tickets' as never).update({ status: 'resolved', resolved_at: now, updated_at: now } as never).eq('id', ticketId)
    await db.from('support_ticket_events' as never).insert({ ticket_id: ticketId, actor_id: user.id, action: `decided_${body.action}`, detail: { note } } as never)
  }
  return { success: true }
})
