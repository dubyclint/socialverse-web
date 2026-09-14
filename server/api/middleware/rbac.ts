// server/api/middleware/rbac.ts
// Role-Based Access Control, resolved from the Supabase SSR session.

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { createError } from 'h3'
import type { H3Event } from 'h3'
import type { Database } from '~/types/database.types'

export interface AuthenticatedUser {
  id: string
  email: string
  username: string
  role: string
}

export interface RBACOptions {
  allowedRoles?: string[]
  requireAuth?: boolean
}

/**
 * Resolve the caller from the Supabase session cookie and enforce role access.
 * Usage: await verifyAuth(event, { allowedRoles: ['admin', 'moderator'] })
 */
export async function verifyAuth(
  event: H3Event,
  options: RBACOptions = {}
): Promise<AuthenticatedUser | null> {
  const { allowedRoles = [], requireAuth = true } = options

  const sessionUser = await serverSupabaseUser(event)

  if (!sessionUser) {
    if (requireAuth) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    return null
  }

  const client = await serverSupabaseClient<Database>(event)
  const { data: profile } = await client
    .from('user')
    .select('username, role')
    .eq('user_id', sessionUser.id)
    .maybeSingle()

  const user: AuthenticatedUser = {
    id: sessionUser.id,
    email: sessionUser.email ?? '',
    username: profile?.username ?? '',
    role: profile?.role ?? 'user'
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: `Access denied. Required roles: ${allowedRoles.join(', ')}`
    })
  }

  return user
}

/** Caller plus their profile row, or null when unauthenticated. */
export async function getUserFromSession(event: H3Event) {
  const sessionUser = await serverSupabaseUser(event)
  if (!sessionUser) return null

  const client = await serverSupabaseClient<Database>(event)
  const { data: profile } = await client
    .from('user')
    .select('*')
    .eq('user_id', sessionUser.id)
    .maybeSingle()

  return { id: sessionUser.id, email: sessionUser.email, ...profile }
}
