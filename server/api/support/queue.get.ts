import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { getStaffAccess } from '~/server/utils/staff-access'
import { supportDb } from '~/server/utils/support'

/**
 * Agent queue. Agents see unclaimed tickets (their languages first, English fallback) and their own;
 * managers/admins can see everything; dispute deciders see escalated tickets.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const access = await getStaffAccess(user.id)
  if (!access.isSupport && !access.canDecideDisputes) throw createError({ statusCode: 403, statusMessage: 'Support access required' })
  const scope = String(getQuery(event).scope ?? 'queue')
  const db = supportDb()
  let q = db.from('support_tickets').select('*').order('created_at', { ascending: true }).limit(200)
  if (scope === 'mine') q = q.eq('assigned_to', user.id).not('status', 'in', '(resolved,closed)')
  else if (scope === 'escalated') q = q.eq('status', 'escalated')
  else if (scope === 'all' && access.isSupportManager) q = q.order('updated_at', { ascending: false })
  else q = q.is('assigned_to', null).in('status', ['open', 'pending', 'escalated'])
  const { data } = await q
  let tickets = (data ?? []).filter((t: { user_id: string, counterparty_id: string | null }) => t.user_id !== user.id && t.counterparty_id !== user.id)
  if (scope === 'queue' && access.languages.length) {
    const langs = new Set([...access.languages, 'en'])
    const rank = (t: { language: string, priority: string }) => (t.priority === 'urgent' ? 0 : t.priority === 'high' ? 1 : 2) * 2 + (langs.has(t.language) ? 0 : 1)
    tickets = tickets.sort((a: never, b: never) => rank(a) - rank(b))
  }
  const ids = [...new Set(tickets.flatMap((t: { user_id: string, assigned_to: string | null }) => [t.user_id, t.assigned_to]).filter(Boolean))]
  const { data: people } = ids.length ? await db.from('user').select('user_id, username, display_name, avatar_url').in('user_id', ids) : { data: [] }
  return { tickets, people: people ?? [], access: { roles: access.roles, isSupportManager: access.isSupportManager, canDecide: access.canDecideDisputes } }
})
