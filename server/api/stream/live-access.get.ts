import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { getLiveEligibility } from '~/server/utils/live-access'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  return { success: true, data: await getLiveEligibility(user.id) }
})
