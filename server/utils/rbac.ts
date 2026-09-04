import { createError, type H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

export type AppRole = Database['public']['Enums']['user_role']

export interface Actor {
  id: string
  role: AppRole
}

const RANK: Record<AppRole, number> = {
  user: 0,
  moderator: 1,
  manager: 2,
  admin: 3
}

export async function getActor(event: H3Event): Promise<Actor> {
  const user = await requireAuth(event)
  const client = await serverSupabaseClient<Database>(event)

  const { data } = await client
    .from('user')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  return { id: user.id, role: data?.role ?? 'user' }
}

export async function requireRole(event: H3Event, minimum: AppRole): Promise<Actor> {
  const actor = await getActor(event)
  if (RANK[actor.role] < RANK[minimum]) {
    throw createError({ statusCode: 403, statusMessage: `${minimum} access required` })
  }
  return actor
}

export function hasRole(actor: Actor, minimum: AppRole): boolean {
  return RANK[actor.role] >= RANK[minimum]
}

/**
 * Selling is a privilege: the caller needs an active, unrevoked seller profile.
 * Admins and managers are implicitly sellers.
 */
export async function requireSeller(event: H3Event): Promise<Actor & { maxMarginPct: number }> {
  const actor = await getActor(event)
  const client = await serverSupabaseClient<Database>(event)

  const { data } = await client
    .from('seller_profiles')
    .select('is_active, revoked_at, max_margin_pct')
    .eq('user_id', actor.id)
    .maybeSingle()

  if (!data || !data.is_active || data.revoked_at) {
    throw createError({ statusCode: 403, statusMessage: 'Seller privilege required' })
  }

  return { ...actor, maxMarginPct: data.max_margin_pct }
}
