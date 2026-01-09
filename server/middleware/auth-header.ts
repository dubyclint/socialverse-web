// ============================================================================
// FILE: /server/middleware/auth-header.ts - COMPLETE FIXED VERSION
// ============================================================================
// ✅ FIXED: Properly extracts and validates JWT token from Authorization header
// ✅ FIXED: Handles token validation errors correctly
// ✅ FIXED: Sets user context for authenticated requests
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'
import { jwtDecode } from 'jwt-decode'

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
    console.log('[Auth Header Middleware] Headers:', Object.keys(event.node.req.headers))
    
    // Get Authorization header
    const authHeader = event.node.req.headers.authorization
    
    console.log('[Auth Header Middleware] Authorization header present:', !!authHeader)
    
    if (!authHeader) {
      console.log('[Auth Header Middleware] ℹ️ No Authorization header found')
      // Try to get session from Supabase (for cookie-based auth)
      try {
        const supabase = await serverSupabaseClient(event)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('[Auth Header Middleware] ✅ Session found from cookies')
          event.context.user = session.user
          event.context.supabaseSession = session
        } else {
          console.log('[Auth Header Middleware] ⚠️ No session found in cookies either')
        }
      } catch (err) {
        console.error('[Auth Header Middleware] Error getting session from cookies:', err)
      }
      return
    }

    // Extract token from "Bearer <token>"
    let token = authHeader
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    }

    console.log('[Auth Header Middleware] Token extracted, length:', token.length)
    console.log('[Auth Header Middleware] Token starts with:', token.substring(0, 20) + '...')

    // ✅ CRITICAL: Decode token to get user info
    try {
      const decoded: any = jwtDecode(token)
      console.log('[Auth Header Middleware] Token decoded successfully')
      console.log('[Auth Header Middleware] Token sub (user ID):', decoded.sub)
      console.log('[Auth Header Middleware] Token email:', decoded.email)
      console.log('[Auth Header Middleware] Token exp:', new Date(decoded.exp * 1000).toISOString())
      
      // Check if token is expired
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        console.error('[Auth Header Middleware] ❌ Token is expired')
        throw createError({
          statusCode: 401,
          statusMessage: 'Token expired'
        })
      }
    } catch (decodeErr: any) {
      console.error('[Auth Header Middleware] ❌ Failed to decode token:', decodeErr.message)
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token format'
      })
    }

    // ✅ CRITICAL: Validate token using Supabase
    try {
      const supabase = await serverSupabaseClient(event)
      
      console.log('[Auth Header Middleware] Validating token with Supabase...')
      
      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error) {
        console.error('[Auth Header Middleware] ❌ Supabase validation error:', error.message)
        throw createError({
          statusCode: 401,
          statusMessage: 'Token validation failed: ' + error.message
        })
      }

      if (!user) {
        console.error('[Auth Header Middleware] ❌ No user returned from Supabase')
        throw createError({
          statusCode: 401,
          statusMessage: 'User not found'
        })
      }

      console.log('[Auth Header Middleware] ✅ Token validated for user:', user.id)
      console.log('[Auth Header Middleware] User email:', user.email)
      
      // Store user in event context for use in endpoints
      event.context.user = user
      event.context.authToken = token
      
      console.log('[Auth Header Middleware] ✅ User context set')

    } catch (validationErr: any) {
      console.error('[Auth Header Middleware] ❌ Token validation exception:', validationErr.message)
      
      if (validationErr.statusCode) {
        throw validationErr
      }
      
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

  } catch (error: any) {
    console.error('[Auth Header Middleware] ============ MIDDLEWARE ERROR ============')
    console.error('[Auth Header Middleware] Error:', error.message)
    console.error('[Auth Header Middleware] Status:', error.statusCode)
    console.error('[Auth Header Middleware] ============ END ERROR ============')
    
    // Re-throw if it's already a proper error
    if (error.statusCode) {
      throw error
    }
    
    // Otherwise throw generic unauthorized
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
})
