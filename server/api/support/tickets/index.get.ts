import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { supportDb } from '~/server/utils/support'

/** The caller's own tickets (opened by them or raised against them in a P2P dispute). */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { data } = await supportDb().from('support_tickets').select('*')
    .or(`user_id.eq.${user.id},counterparty_id.eq.${user.id}`).order('updated_at', { ascending: false }).limit(100)
  return { tickets: data ?? [] }
})
