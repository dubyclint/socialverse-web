import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { loadTicketFor, supportDb } from '~/server/utils/support'

/** Ticket thread. Staff also get the linked P2P trade summary and audit trail; financial detail only for dispute deciders. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { ticket, access, isParty, isStaffView } = await loadTicketFor(user.id, getRouterParam(event, 'id')!)
  const db = supportDb()
  const { data: messages } = await db.from('support_messages').select('*').eq('ticket_id', ticket.id).order('created_at')
  const ids = [...new Set([ticket.user_id, ticket.counterparty_id, ticket.assigned_to, ...(messages ?? []).map((m: { sender_id: string | null }) => m.sender_id)].filter(Boolean))]
  const { data: people } = await db.from('user').select('user_id, username, display_name, avatar_url').in('user_id', ids)
  let trade = null
  let events = null
  if (ticket.trade_id) {
    const { data } = await db.from('p2p_trades').select('id, kind, status, amount, asset_code, source_amount, fee_pewgift, seller_id, buyer_id, merchant_id, paid_declared_at, seller_confirmed_at, expires_at, created_at, dispute_reason, dispute_opened_by, decided_by, decision_note' + (access.canDecideDisputes ? ', payout_details, chat_room_id' : '')).eq('id', ticket.trade_id).maybeSingle()
    trade = data
  }
  if (isStaffView) {
    const { data } = await db.from('support_ticket_events').select('*').eq('ticket_id', ticket.id).order('created_at')
    events = data
  }
  return {
    ticket, messages: messages ?? [], people: people ?? [], trade, events,
    viewer: { isParty, isStaffView, canClaim: access.isSupport && !ticket.assigned_to, canDecide: access.canDecideDisputes, isSupportManager: access.isSupportManager }
  }
})
