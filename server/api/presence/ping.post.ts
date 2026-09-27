import { defineEventHandler } from 'h3'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { markPresence } from '~/server/utils/presence'

/** Heartbeat: refreshes the caller's online state (Redis when configured). */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  await markPresence(user.id)
  return { success: true }
})
