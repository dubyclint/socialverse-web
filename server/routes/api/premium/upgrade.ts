// server/routes/api/premium/upgrade.ts
import { PremiumController } from '~/server/controllers/premium-controller'

export default defineEventHandler(async (event) => {
  if (event.node.req.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }
  return await PremiumController.upgradeSubscription(event)
})
