// FILE: /server/gateway/auth/auth-bouncer.ts
import { serverSupabaseClient } from '#supabase/server'
import type { H3Event } from 'h3'

// --- Token Validation Logic ---
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
}

export async function validateTokenAndGetUser(event: H3Event, token: string) {
  try {
    const supabase = await serverSupabaseClient(event)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    return { user, error }
  } catch (error) {
    return { user: null, error }
  }
}

export async function getAuthenticatedUser(event: H3Event): Promise<any> {
  if (event.context.user?.id) return event.context.user
  
  const authHeader = event.node.req.headers.authorization
  if (authHeader) {
    const token = extractTokenFromHeader(authHeader)
    if (token) {
      const { user, error } = await validateTokenAndGetUser(event, token)
      if (user && !error) return user
    }
  }

  try {
    const supabase = await serverSupabaseClient(event)
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) return session.user
  } catch (error) {
    console.error('[Auth] Session check error:', error)
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
