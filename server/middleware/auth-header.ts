// ============================================================================
// FILE: /server/middleware/auth-header.ts - SIMPLIFIED JWT-ONLY VERSION
// ============================================================================
// ✅ FIXED: NO Supabase API calls - just JWT decoding and validation
// ============================================================================

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
    
    // Get Authorization header
    const authHeader = event.node.req.headers.authorization
    
    if (!authHeader) {
      console.log('[Auth Header Middleware] ℹ️ No Authorization header found')
      return
    }

    // Extract token from "Bearer <token>"
    let token = authHeader
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    }

    console.log('[Auth Header Middleware] Token extracted, length:', token.length)

    // ✅ ONLY: Decode JWT token
    let decoded: any
    try {
      decoded = jwtDecode(token)
      console.log('[Auth Header Middleware] ✅ Token decoded successfully')
      console.log('[Auth Header Middleware] User ID:', decoded.sub)
      console.log('[Auth Header Middleware] Email:', decoded.email)
    } catch (decodeErr: any) {
      console.error('[Auth Header Middleware] ❌ Failed to decode token:', decodeErr.message)
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token format'
      })
    }

    // ✅ Validate token expiration
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      console.error('[Auth Header Middleware] ❌ Token is expired')
      throw createError({
        statusCode: 401,
        statusMessage: 'Token expired'
      })
    }

    // ✅ Validate token audience
    if (decoded.aud !== 'authenticated') {
      console.error('[Auth Header Middleware] ❌ Invalid token audience:', decoded.aud)
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token audience'
      })
    }

    // ✅ Extract user ID
    const userId = decoded.sub
    if (!userId) {
      console.error('[Auth Header Middleware] ❌ No user ID in token')
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token: missing user ID'
      })
    }

    console.log('[Auth Header Middleware] ✅ Token validation passed')
    
    // ✅ Create user object from JWT payload
    const user = {
      id: userId,
      email: decoded.email || '',
      user_metadata: decoded.user_metadata || {},
      app_metadata: decoded.app_metadata || {},
      aud: decoded.aud,
      role: decoded.role || 'authenticated'
    }

    // Store user in event context
    event.context.user = user
    event.context.authToken = token
    event.context.jwtPayload = decoded
    
    console.log('[Auth Header Middleware] ✅ User context set')

  } catch (error: any) {
    console.error('[Auth Header Middleware] Error:', error.message)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
})
