// ============================================================================
// FILE: /server/middleware/auth-header.ts (NEW - EXTRACT TOKEN FROM HEADER)
// ============================================================================
// This middleware extracts JWT token from Authorization header
// and validates it using Supabase
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Skip middleware for public routes
  const publicRoutes = [
    '/api/auth/signup',
    '/api/auth/login',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
    '/api/health',
    '/api/interests',
  ]

  const isPublicRoute = publicRoutes.some(route => event.node.req.url?.startsWith(route))
  
  if (isPublicRoute) {
    console.log('[Auth Header Middleware] Skipping auth for public route:', event.node.req.url)
    return
  }

  try {
    console.log('[Auth Header Middleware] Processing request:', event.node.req.url)
    
    // Get Authorization header
    const authHeader = event.node.req.headers.authorization
    
    if (!authHeader) {
      console.log('[Auth Header Middleware] ℹ️ No Authorization header found')
      // Try to get session from Supabase (for cookie-based auth)
      const supabase = await serverSupabaseClient(event)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        console.log('[Auth Header Middleware] ✅ Session found from cookies')
        event.context.user = session.user
        event.context.supabaseSession = session
      }
      return
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader

    console.log('[Auth Header Middleware] Token found, length:', token.length)

    // Validate token using Supabase
    const supabase = await serverSupabaseClient(event)
    
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.error('[Auth Header Middleware] ❌ Token validation failed:', error?.message)
      // Don't throw here - let the endpoint handle it
      return
    }

    console.log('[Auth Header Middleware] ✅ Token validated for user:', user.id)
    
    // Store user in event context for use in endpoints
    event.context.user = user
    event.context.authToken = token

  } catch (error: any) {
    console.error('[Auth Header Middleware] Error:', error.message)
    // Don't throw - let endpoints handle auth errors
  }
})
