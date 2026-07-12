// ============================================================================
// FILE: server/gateway/auth/auth-middleware.ts
// ============================================================================
import { defineEventHandler } from 'h3'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'

export default defineEventHandler(async (event) => {
  // Only process requests aimed at server endpoints
  if (event.node.req.url?.startsWith('/api/')) {
    console.log(`[Server Auth Middleware] Intercepting request: ${event.node.req.url}`)
    
    try {
      await requireAuth(event)
    } catch (error) {
      // ✅ FIXED: Removed the explicitly typed ": any" declaration 
      // This keeps the syntax valid even if compilation flags shift.
      console.warn('[Server Auth Middleware] Session validation bypass or miss.')
    }
  }
})
