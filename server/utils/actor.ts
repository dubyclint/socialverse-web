import { createError, getHeader, type H3Event } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import type { Database } from '~/types/database.types'

export type ActorType = 'USER' | 'PAGE'
export type PageRole = Database['public']['Enums']['page_role']

export interface Actor {
  type: ActorType
  /** user_id for USER, page id for PAGE */
  id: string
  /** The authenticated human behind the request. */
  userId: string
  role: PageRole | null
}

export const ACTOR_ID_HEADER = 'x-acting-as-actor-id'
export const ACTOR_TYPE_HEADER = 'x-acting-as-actor-type'
export const PAGE_ROLES: readonly PageRole[] = ['OWNER', 'MANAGER', 'MODERATOR']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const getPageRole = async (pageId: string, userId: string): Promise<PageRole | null> => {
  if (!UUID.test(pageId)) return null
  const { data } = await getServiceClient()
    .from('page_admins')
    .select('role')
    .eq('page_id', pageId)
    .eq('user_id', userId)
    .maybeSingle()
  return data?.role ?? null
}

/** True when the request carries a PAGE acting-as header. */
/** Page id when the request was already validated as acting for a Page. */
export const actingPageId = (event: H3Event): string | null => {
  const actor = (event.context as { actor?: Actor }).actor
  return actor?.type === 'PAGE' ? actor.id : null
}

/** Post ids liked by the person (pageId null) or by the Page they act as. */
export const getLikedPostIds = async (userId: string | null, pageId: string | null, postIds: string[]): Promise<Set<string>> => {
  if (!userId || !postIds.length) return new Set()
  const query = getServiceClient().from('post_likes').select('post_id').in('post_id', postIds)
  const { data } = pageId ? await query.eq('page_id', pageId) : await query.eq('user_id', userId).is('page_id', null)
  return new Set((data ?? []).map(row => row.post_id))
}

export const isActingAsPage = (event: H3Event): boolean =>
  (getHeader(event, ACTOR_TYPE_HEADER) ?? '').toUpperCase() === 'PAGE'

/**
 * The identity a request acts as. A PAGE identity is only accepted when the
 * caller holds a role on that page in page_admins; otherwise 403.
 */
export const resolveActor = async (event: H3Event): Promise<Actor> => {
  const cached = (event.context as { actor?: Actor }).actor
  if (cached) return cached

  const user = await requireUser(event)
  let actor: Actor = { type: 'USER', id: user.id, userId: user.id, role: null }

  if (isActingAsPage(event)) {
    const pageId = getHeader(event, ACTOR_ID_HEADER) ?? ''
    const role = await getPageRole(pageId, user.id)
    if (!role) throw createError({ statusCode: 403, statusMessage: 'You do not manage this Page' })
    actor = { type: 'PAGE', id: pageId, userId: user.id, role }
  }

  ;(event.context as { actor?: Actor }).actor = actor
  return actor
}

export const requirePageRole = async (
  event: H3Event,
  pageId: string,
  allowed: readonly PageRole[]
): Promise<{ userId: string, role: PageRole }> => {
  const user = await requireUser(event)
  const role = await getPageRole(pageId, user.id)
  if (!role || !allowed.includes(role)) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have permission for this Page' })
  }
  return { userId: user.id, role }
}
