// FILE: /server/gateway/auth/auth-bouncer.ts
import { serverSupabaseUser } from '#supabase/server'
import { createError, type H3Event } from 'h3'

// --- Auth Bouncer & Session Extraction ---
export async function getAuthenticatedUser(event: H3Event): Promise<any> {
  if (event.context.user?.id) return event.context.user

  try {
    // Leverage the native Nuxt Supabase module helper to read and validate the session cookie
    const user = await serverSupabaseUser(event)
    if (user) return user
  } catch (error) {
    console.error('[Auth Bouncer] Native session extraction error:', error)
  }

  return null
}

// --- Auth Guards ---
export async function requireAuth(event: H3Event): Promise<any> {
  const user = await getAuthenticatedUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  return user
}

export const requirePermission = async (event: H3Event, level: 'verified' | 'premium') => {
  const user = await requireAuth(event)
  if (level === 'verified' && !user.user_metadata?.is_verified) {
    throw createError({ statusCode: 403, message: 'Verification required.' })
  }
  if (level === 'premium' && !user.user_metadata?.is_premium) {
    throw createError({ statusCode: 403, message: 'Premium subscription required.' })
  }
  return user
}
