// server/routes/securityRoutes.js
// Nuxt 3 Consolidated Route Handler - Security Management
import { SecurityController } from '../api/controllers/securityController'
import {
  validateSession,
  checkIPBan,
  checkAccountSuspension,
  rateLimit,
  securityMonitor
} from '../api/middleware/securityMiddleware'

export default defineEventHandler(async (event) => {
  const { method } = event
  const path = event.node.req.url?.split('?')[0] || ''

  // Extract session ID from path
  const sessionIdMatch = path.match(/\/security\/sessions\/([^/]+)/)
  const sessionId = sessionIdMatch?.[1]

  try {
    // Apply security middleware to all routes
    await checkIPBan(event)
    await securityMonitor(event)
    await rateLimit({ maxRequests: 60, windowMs: 15 * 60 * 1000 })(event) // 60 requests per 15 minutes

    // Session management routes
    await validateSession(event)
    await checkAccountSuspension(event)

    // User security routes
    if (method === 'GET' && path.endsWith('/security/sessions')) {
      return await SecurityController.getUserSessions(event)
    }

    if (method === 'DELETE' && sessionId) {
      return await SecurityController.terminateSession(event, sessionId)
    }

    if (method === 'POST' && path.endsWith('/security/sessions/terminate-all')) {
      return await SecurityController.terminateAllSessions(event)
    }

    if (method === 'GET' && path.endsWith('/security/events')) {
      return await SecurityController.getUserSecurityEvents(event)
    }

    if (method === 'GET' && path.endsWith('/security/statistics')) {
      return await SecurityController.getSecurityStatistics(event)
    }

    // Admin routes
    if (method === 'GET' && path.includes('/security/admin/users')) {
      return await SecurityController.getAdminUserSecurity(event)
    }

    throw createError({
      statusCode: 404,
      message: 'Route not found'
    })
  } catch (error) {
    console.error('Security Route Error:', error)
    throw error
  }
})
