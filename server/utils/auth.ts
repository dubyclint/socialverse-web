import { createError, type H3Event } from 'h3'
import { serverSupabaseUser } from '#supabase/server'

export interface AuthedUser {
  id: string
  email: string | null
}

/**
 * Resolve the caller, or null when the request is anonymous.
 *
 * `server/middleware/00-auth-context` has already resolved the session (cookie
 * or `Authorization: Bearer`), so prefer its result; `serverSupabaseUser`
 * throws instead of returning null when no session exists, which otherwise
 * surfaces to clients as a 500.
 */
export const getOptionalUser = async (event: H3Event): Promise<AuthedUser | null> => {
  const fromContext = (event.context as { user?: { id?: string, email?: string | null } }).user
  if (fromContext?.id) return { id: fromContext.id, email: fromContext.email ?? null }

  const user = await serverSupabaseUser(event).catch(() => null)
  return user?.id ? { id: user.id, email: user.email ?? null } : null
}

export const requireUser = async (event: H3Event): Promise<AuthedUser> => {
  const user = await getOptionalUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  return user
}
