import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { supportDb, logTicketEvent } from '~/server/utils/support'
import { enforceRateLimit } from '~/server/utils/rate-limit'

const CATEGORIES = ['general', 'account', 'wallet', 'escrow', 'verification', 'safety', 'other']

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  await enforceRateLimit(event, 'support:create', { limit: 5, windowMs: 10 * 60_000 }, user.id)
  const body = await readBody<{ subject?: string, category?: string, message?: string, language?: string, attachments?: string[] }>(event)
  const subject = String(body.subject ?? '').trim().slice(0, 140)
  const message = String(body.message ?? '').trim().slice(0, 4000)
  if (!subject || !message) throw createError({ statusCode: 400, statusMessage: 'Add a subject and describe the problem' })
  const category = CATEGORIES.includes(String(body.category)) ? String(body.category) : 'general'
  const language = String(body.language ?? 'en').toLowerCase().slice(0, 2) || 'en'
  const db = supportDb()
  const { data: u } = await db.from('user').select('phone').eq('user_id', user.id).maybeSingle()
  const { data: ticket, error } = await db.from('support_tickets').insert({
    user_id: user.id, subject, category, language, country: u?.phone ? String(u.phone).match(/^\+\d{1,3}/)?.[0] ?? null : null
  }).select().single()
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  const attachments = (body.attachments ?? []).filter(a => typeof a === 'string' && a.startsWith('http')).slice(0, 6)
  await db.from('support_messages').insert({ ticket_id: ticket.id, sender_id: user.id, body: message, attachments })
  await logTicketEvent(ticket.id, user.id, 'created', { category })
  return { ticket }
})
