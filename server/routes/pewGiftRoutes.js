// server/routes/pewGiftRoutes.js
// Nuxt 3 Consolidated Route Handler - Pew Gift Management
import { PewGiftController } from '../api/controllers/pewGiftController'
import { authMiddleware } from '../api/middleware/auth'
import { rateLimitMiddleware } from '../api/middleware/rateLimit'

export default defineEventHandler(async (event) => {
  const { method } = event
  const path = event.node.req.url?.split('?')[0] || ''

  // Extract transaction ID from path
  const transactionIdMatch = path.match(/\/pew-gift\/cancel\/([^/]+)/)
  const transactionId = transactionIdMatch?.[1]

  try {
    // Apply authentication to all routes
    await authMiddleware(event)

    // Gift sending routes
    if (method === 'POST' && path.endsWith('/pew-gift/send')) {
      await rateLimitMiddleware(10, 60)(event) // 10 requests per 60 seconds
      return await PewGiftController.sendGift(event)
    }

    if (method === 'POST' && path.endsWith('/pew-gift/send-bulk')) {
      await rateLimitMiddleware(5, 60)(event) // 5 requests per 60 seconds
      return await PewGiftController.sendBulkGifts(event)
    }

    if (method === 'GET' && path.endsWith('/pew-gift/preview')) {
      return await PewGiftController.getGiftPreview(event)
    }

    // Transaction management
    if (method === 'GET' && path.endsWith('/pew-gift/history')) {
      return await PewGiftController.getTransactionHistory(event)
    }

    if (method === 'GET' && path.endsWith('/pew-gift/analytics')) {
      return await PewGiftController.getGiftAnalytics(event)
    }

    if (method === 'DELETE' && transactionId) {
      return await PewGiftController.cancelGift(event, transactionId)
    }

    // Balance management
    if (method === 'GET' && path.endsWith('/pew-gift/balance')) {
      return await PewGiftController.getUserBalance(event)
    }

    throw createError({
      statusCode: 404,
      message: 'Route not found'
    })
  } catch (error) {
    console.error('Pew Gift Route Error:', error)
    throw error
  }
})
