// server/routes/api/premium/features.ts
import { PremiumController } from '~/server/controllers/premium-controller'

export default defineEventHandler(async (event) => {
  if (event.node.req.method !== 'GET') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }
  return await PremiumController.getUserFeatures(event)
})
