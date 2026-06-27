// ============================================================================
// FILE: server/middleware/auth.ts
// ============================================================================
import { defineEventHandler } from 'h3'
import { authenticateUser } from '../utils/auth-utils'

export default defineEventHandler(async (event) => {
  // Only process requests aimed at server endpoints
  if (event.node.req.url?.startsWith('/api/')) {
    console.log(`[Server Auth Middleware] Intercepting request: ${event.node.req.url}`)
    
    try {
      await authenticateUser(event)
    } catch (error) {
      // ✅ FIXED: Removed the explicitly typed ": any" declaration 
      // This keeps the syntax valid even if compilation flags shift.
      console.warn('[Server Auth Middleware] Session validation bypass or miss.')
    }
  }
})
