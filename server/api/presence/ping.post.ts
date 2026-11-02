import { defineEventHandler } from 'h3'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { markPresence } from '~/server/utils/presence'
import { getServiceClient } from '~/server/utils/supabase-admin'

/** Heartbeat: refreshes the caller's online state (Redis when configured). */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  await markPresence(user.id)
  await getServiceClient().rpc('track_active_time' as never, { p_user: user.id } as never).then(({ error }) => { if (error) console.error('[presence] active time', error.message) })
  return { success: true }
})
