import { getServiceClient } from '~/server/utils/supabase-admin'
import { getStaffAccess, type StaffAccess } from '~/server/utils/staff-access'

export interface SupportTicket {
  id: string
  user_id: string
  counterparty_id: string | null
  subject: string
  category: string
  status: 'open' | 'pending' | 'escalated' | 'resolved' | 'closed'
  priority: string
  language: string
  country: string | null
  assigned_to: string | null
  claimed_at: string | null
  escalated_at: string | null
  escalation_note: string | null
  first_response_at: string | null
  resolved_at: string | null
  trade_id: string | null
  created_at: string
  updated_at: string
}

export const supportDb = () => getServiceClient() as unknown as ReturnType<typeof getServiceClient> & { from: (t: string) => any }

/**
 * Ticket visibility (least privilege): the opener and dispute counterparty, the assigned agent,
 * any support agent for unclaimed tickets, support managers/admins for everything.
 */
export async function loadTicketFor(userId: string, ticketId: string): Promise<{ ticket: SupportTicket, access: StaffAccess, isParty: boolean, isStaffView: boolean }> {
  const db = supportDb()
  const { data: ticket } = await db.from('support_tickets').select('*').eq('id', ticketId).maybeSingle()
  if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Ticket not found' })
  const access = await getStaffAccess(userId)
  const isParty = ticket.user_id === userId || ticket.counterparty_id === userId
  const isStaffView = access.isSupportManager
    || (access.isSupport && (ticket.assigned_to === userId || !ticket.assigned_to))
    || (ticket.status === 'escalated' && access.canDecideDisputes)
  if (!isParty && !isStaffView) throw createError({ statusCode: 403, statusMessage: 'Not allowed to view this ticket' })
  return { ticket, access, isParty, isStaffView }
}

export async function logTicketEvent(ticketId: string, actorId: string | null, action: string, detail: Record<string, unknown> = {}) {
  await supportDb().from('support_ticket_events').insert({ ticket_id: ticketId, actor_id: actorId, action, detail })
}
