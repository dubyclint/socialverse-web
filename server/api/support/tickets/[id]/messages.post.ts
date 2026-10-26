import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { loadTicketFor, supportDb, logTicketEvent } from '~/server/utils/support'
import { sendNotification } from '~/server/utils/send-notification'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { ticket, isParty, isStaffView } = await loadTicketFor(user.id, getRouterParam(event, 'id')!)
  const body = await readBody<{ body?: string, attachments?: string[] }>(event)
  const text = String(body.body ?? '').trim().slice(0, 4000)
  const attachments = (body.attachments ?? []).filter(a => typeof a === 'string' && a.startsWith('http')).slice(0, 6)
  if (!text && !attachments.length) throw createError({ statusCode: 400, statusMessage: 'Message is empty' })
  if (ticket.status === 'closed') throw createError({ statusCode: 400, statusMessage: 'This ticket is closed' })
  const asStaff = !isParty && isStaffView
  if (asStaff && ticket.assigned_to !== user.id && ticket.status !== 'escalated') {
    throw createError({ statusCode: 403, statusMessage: 'Claim the ticket before replying' })
  }
  const db = supportDb()
  const { data: msg, error } = await db.from('support_messages').insert({ ticket_id: ticket.id, sender_id: user.id, body: text, attachments, is_staff: asStaff }).select().single()
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  const now = new Date().toISOString()
  const patch: Record<string, unknown> = { updated_at: now }
  if (asStaff && !ticket.first_response_at) patch.first_response_at = now
  if (asStaff && ticket.status === 'open') patch.status = 'pending'
  if (!asStaff && ticket.status === 'resolved') patch.status = 'open'
  await db.from('support_tickets').update(patch).eq('id', ticket.id)
  await logTicketEvent(ticket.id, user.id, asStaff ? 'staff_reply' : 'user_reply', { attachments: attachments.length })
  const notify = asStaff ? [ticket.user_id, ticket.counterparty_id] : [ticket.assigned_to]
  for (const uid of notify.filter((x): x is string => !!x && x !== user.id)) {
    await sendNotification(event, uid, 'system', `Support ticket update: ${ticket.subject}`, user.id, ticket.id)
  }
  return { message: msg }
})
