// server/routes/statusRoutes.js
// Nuxt 3 Consolidated Route Handler - Status Management with File Upload
import statusController from '../api/controllers/statusController'
import { authenticateToken } from '../api/middleware/auth'
import { useStorage } from '#imports'

export default defineEventHandler(async (event) => {
  const { method } = event
  const path = event.node.req.url?.split('?')[0] || ''

  // Extract status ID from path
  const statusIdMatch = path.match(/\/status\/([^/]+)/)
  const statusId = statusIdMatch?.[1]

  try {
    // Configure multer-like file upload handling for Nuxt 3
    const handleFileUpload = async () => {
      const formData = await readMultipartFormData(event)
      return formData
    }

    // Create status with file upload
    if (method === 'POST' && path.endsWith('/status/create')) {
      await authenticateToken(event)
      const files = await handleFileUpload()
      return await statusController.createStatus(event, files)
    }

    // Get user's statuses
    if (method === 'GET' && path === '/status') {
      await authenticateToken(event)
      return await statusController.getUserStatuses(event)
    }

    // Get status details
    if (method === 'GET' && statusId && !path.includes('/like') && !path.includes('/view')) {
      await authenticateToken(event)
      return await statusController.getStatusDetails(event, statusId)
    }

    // Like/Unlike status
    if (method === 'POST' && path.includes('/like')) {
      await authenticateToken(event)
      return await statusController.toggleLikeStatus(event, statusId)
    }

    // View status
    if (method === 'POST' && path.includes('/view')) {
      await authenticateToken(event)
      return await statusController.recordStatusView(event, statusId)
    }

    // Delete status
    if (method === 'DELETE' && statusId) {
      await authenticateToken(event)
      return await statusController.deleteStatus(event, statusId)
    }

    // Get status analytics
    if (method === 'GET' && path.includes('/analytics')) {
      await authenticateToken(event)
      return await statusController.getStatusAnalytics(event, statusId)
    }

    throw createError({
      statusCode: 404,
      message: 'Route not found'
    })
  } catch (error) {
    console.error('Status Route Error:', error)
    throw error
  }
})
