// server/routes/api/premium/status.ts
import { PremiumController } from '~/server/controllers/premium-controller'

export default defineEventHandler(async (event) => {
  return await PremiumController.getSubscriptionStatus(event)
})
