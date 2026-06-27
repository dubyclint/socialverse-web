// ============================================================================
// FILE: /server/utils/token-validator.ts (NEW - TOKEN VALIDATION UTILITY)
// ============================================================================
// Utility functions for validating JWT tokens from Authorization header
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'
import type { H3Event } from 'h3'

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null
  }

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  return authHeader
}

/**
 * Validate token and get user
 */
export async function validateTokenAndGetUser(
  event: H3Event,
  token: string
): Promise<{ user: any; error: any }> {
  try {
    const supabase = await serverSupabaseClient(event)
    
    const { data: { user }, error } = await supabase.auth.getUser(token)

    return { user, error }
  } catch (error) {
    return { user: null, error }
  }
}

/**
 * Get authenticated user from event
 * Tries multiple methods: context, header, session
 */
export async function getAuthenticatedUser(event: H3Event): Promise<any> {
  // Method 1: Check context (set by middleware)
  if (event.context.user?.id) {
    return event.context.user
  }

  // Method 2: Check Authorization header
  const authHeader = event.node.req.headers.authorization
  if (authHeader) {
    const token = extractTokenFromHeader(authHeader)
    if (token) {
      const { user, error } = await validateTokenAndGetUser(event, token)
      if (user && !error) {
        return user
      }
    }
  }

  // Method 3: Check Supabase session (cookies)
  try {
    const supabase = await serverSupabaseClient(event)
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      return session.user
    }
  } catch (error) {
    console.error('[Token Validator] Session check error:', error)
  }

  return null
}

/**
 * Require authentication middleware
 */
export async function requireAuth(event: H3Event): Promise<any> {
  const user = await getAuthenticatedUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - Please log in'
    })
  }

  return user
}
