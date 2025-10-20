// server/routes/streamRoutes.js
// Nuxt 3 Consolidated Route Handler - Stream Management
import streamController from '../api/controllers/streamController'
import authMiddleware from '../api/middleware/auth'
import rateLimitMiddleware from '../api/middleware/rateLimit'

export default defineEventHandler(async (event) => {
  const { method } = event
  const path = event.node.req.url?.split('?')[0] || ''

  // Extract stream ID from path
  const streamIdMatch = path.match(/\/stream\/([^/]+)/)
  const streamId = streamIdMatch?.[1]

  // Extract user ID from path
  const userIdMatch = path.match(/\/stream\/user\/([^/]+)/)
  const userId = userIdMatch?.[1]

  // Extract category from path
  const categoryMatch = path.match(/\/stream\/category\/([^/]+)/)
  const category = categoryMatch?.[1]

  try {
    // Apply authentication middleware to all routes
    await authMiddleware(event)

    // Stream management routes
    if (method === 'POST' && path.endsWith('/stream/create')) {
      await rateLimitMiddleware(5, 60)(event) // 5 requests per minute
      return await streamController.createStream(event)
    }

    if (method === 'PUT' && path.includes('/start')) {
      return await streamController.startStream(event, streamId)
    }

    if (method === 'PUT' && path.includes('/end')) {
      return await streamController.endStream(event, streamId)
    }

    if (method === 'PUT' && path.includes('/pause')) {
      return await streamController.pauseStream(event, streamId)
    }

    // Stream discovery and viewing
    if (method === 'GET' && path.endsWith('/stream/active')) {
      return await streamController.getActiveStreams(event)
    }

    if (method === 'GET' && path.endsWith('/stream/scheduled')) {
      return await streamController.getScheduledStreams(event)
    }

    if (method === 'GET' && category) {
      return await streamController.getStreamsByCategory(event, category)
    }

    if (method === 'GET' && streamId && !path.includes('/user')) {
      return await streamController.getStreamDetails(event, streamId)
    }

    if (method === 'GET' && userId) {
      return await streamController.getUserStreams(event, userId)
    }

    throw createError({
      statusCode: 404,
      message: 'Route not found'
    })
  } catch (error) {
    console.error('Stream Route Error:', error)
    throw error
  }
})
