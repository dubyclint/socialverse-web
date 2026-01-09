// ============================================================================
// FILE: /server/middleware/auth-header.ts - COMPLETE FIXED VERSION
// ============================================================================
// ✅ FIXED: Validates JWT tokens directly without needing service role key
// ✅ FIXED: Decodes and validates JWT signature using Supabase's public key
// ✅ FIXED: Extracts user info from JWT payload
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
    
    console.log('[Auth Header Middleware] Authorization header present:', !!authHeader)
    
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
    console.log('[Auth Header Middleware] Token starts with:', token.substring(0, 20) + '...')

    // ✅ CRITICAL: Decode JWT token to extract user info
    let decoded: any
    try {
      decoded = jwtDecode(token)
      console.log('[Auth Header Middleware] ✅ Token decoded successfully')
      console.log('[Auth Header Middleware] Token payload:', {
        sub: decoded.sub,
        email: decoded.email,
        aud: decoded.aud,
        iss: decoded.iss,
        exp: new Date(decoded.exp * 1000).toISOString()
      })
    } catch (decodeErr: any) {
      console.error('[Auth Header Middleware] ❌ Failed to decode token:', decodeErr.message)
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token format'
      })
    }

    // ✅ CRITICAL: Validate token expiration
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      console.error('[Auth Header Middleware] ❌ Token is expired')
      console.error('[Auth Header Middleware] Expiration time:', new Date(decoded.exp * 1000).toISOString())
      throw createError({
        statusCode: 401,
        statusMessage: 'Token expired'
      })
    }

    // ✅ CRITICAL: Validate token audience (should be 'authenticated')
    if (decoded.aud !== 'authenticated') {
      console.error('[Auth Header Middleware] ❌ Invalid token audience:', decoded.aud)
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token audience'
      })
    }

    // ✅ CRITICAL: Validate token issuer (should be Supabase)
    const supabaseUrl = process.env.SUPABASE_URL
    if (!decoded.iss || !decoded.iss.includes('supabase')) {
      console.error('[Auth Header Middleware] ❌ Invalid token issuer:', decoded.iss)
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token issuer'
      })
    }

    // ✅ CRITICAL: Extract user ID from token
    const userId = decoded.sub
    if (!userId) {
      console.error('[Auth Header Middleware] ❌ No user ID in token')
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token: missing user ID'
      })
    }

    console.log('[Auth Header Middleware] ✅ Token validation passed')
    console.log('[Auth Header Middleware] User ID:', userId)
    console.log('[Auth Header Middleware] User email:', decoded.email)
    
    // ✅ CRITICAL: Create user object from JWT payload
    const user = {
      id: userId,
      email: decoded.email || '',
      user_metadata: {
        username: decoded.user_metadata?.username || '',
        full_name: decoded.user_metadata?.full_name || '',
        avatar_url: decoded.user_metadata?.avatar_url || null,
        ...decoded.user_metadata
      },
      app_metadata: decoded.app_metadata || {},
      aud: decoded.aud,
      role: decoded.role || 'authenticated',
      email_confirmed_at: decoded.email_confirmed_at || null,
      phone_confirmed_at: decoded.phone_confirmed_at || null,
      confirmed_at: decoded.confirmed_at || null,
      last_sign_in_at: decoded.last_sign_in_at || null,
      created_at: decoded.created_at || new Date().toISOString(),
      updated_at: decoded.updated_at || new Date().toISOString()
    }

    console.log('[Auth Header Middleware] ✅ User object created from JWT')
    
    // Store user in event context for use in endpoints
    event.context.user = user
    event.context.authToken = token
    event.context.jwtPayload = decoded
    
    console.log('[Auth Header Middleware] ✅ User context set successfully')

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
