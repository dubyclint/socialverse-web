import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { loadTicketFor, supportDb, logTicketEvent } from '~/server/utils/support'

/** Staff workflow: claim, release, pending, resolve, close, reopen, escalate (to admin / dispute decider). */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { ticket, access, isParty } = await loadTicketFor(user.id, getRouterParam(event, 'id')!)
  const body = await readBody<{ action?: string, note?: string, assignTo?: string }>(event)
  const action = String(body.action ?? '')
  const note = String(body.note ?? '').trim().slice(0, 1000)
  const now = new Date().toISOString()
  const db = supportDb()
  let patch: Record<string, unknown> = {}

  if (action === 'close' && isParty && ticket.user_id === user.id && ticket.category !== 'p2p_dispute') {
    patch = { status: 'closed', resolved_at: now }
  } else {
    if (!access.isSupport && !access.canDecideDisputes) throw createError({ statusCode: 403, statusMessage: 'Support access required' })
    if (isParty && !access.isAdmin) throw createError({ statusCode: 403, statusMessage: 'You cannot handle a ticket you are part of' })
    const mine = ticket.assigned_to === user.id
    switch (action) {
      case 'claim':
        if (ticket.assigned_to && !mine && !access.isSupportManager) throw createError({ statusCode: 409, statusMessage: 'Already claimed by another agent' })
        patch = { assigned_to: user.id, claimed_at: now }
        break
      case 'assign':
        if (!access.isSupportManager || !body.assignTo) throw createError({ statusCode: 403, statusMessage: 'Support manager access required' })
        patch = { assigned_to: body.assignTo, claimed_at: now }
        break
      case 'unclaim':
        if (!mine && !access.isSupportManager) throw createError({ statusCode: 403, statusMessage: 'Not your ticket' })
        patch = { assigned_to: null, claimed_at: null }
        break
      case 'pending': case 'resolve': case 'reopen':
        if (!mine && !access.isSupportManager) throw createError({ statusCode: 403, statusMessage: 'Claim the ticket first' })
        if (action === 'resolve' && ticket.category === 'p2p_dispute' && ticket.trade_id) {
          const { data: t } = await db.from('p2p_trades').select('status').eq('id', ticket.trade_id).maybeSingle()
          if (t?.status === 'disputed') throw createError({ statusCode: 400, statusMessage: 'Decide the escrow (release or cancel) before resolving' })
        }
        patch = action === 'resolve' ? { status: 'resolved', resolved_at: now } : { status: action === 'pending' ? 'pending' : 'open', resolved_at: null }
        break
      case 'escalate':
        if (!mine && !access.isSupportManager) throw createError({ statusCode: 403, statusMessage: 'Claim the ticket first' })
        if (!note) throw createError({ statusCode: 400, statusMessage: 'Add a note for the admin' })
        patch = { status: 'escalated', escalated_at: now, escalation_note: note, priority: 'urgent' }
        break
      default:
        throw createError({ statusCode: 400, statusMessage: 'Unknown action' })
    }
  }
  const { data, error } = await db.from('support_tickets').update({ ...patch, updated_at: now }).eq('id', ticket.id).select().single()
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  if (note || action === 'claim' || action === 'escalate' || action === 'resolve') {
    const label: Record<string, string> = { claim: 'A support agent joined this ticket.', escalate: 'Escalated to an admin for a final decision.', resolve: 'Marked as resolved.', close: 'Closed by the user.' }
    if (label[action]) await db.from('support_messages').insert({ ticket_id: ticket.id, sender_id: null, body: label[action], is_system: true })
  }
  await logTicketEvent(ticket.id, user.id, action, note ? { note } : {})
  return { ticket: data }
})
