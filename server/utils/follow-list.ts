import { createError, getQuery, getRouterParam, type H3Event } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { DIRECTORY_COLUMNS, loadRelationships, toDirectoryProfile } from '~/server/utils/social-graph'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PAGE_SIZE = 30

/**
 * One page of a user's followers or followings, each annotated with the
 * viewer's own relationship. Followers are public; the owner may hide the
 * list of accounts they follow from everyone else.
 */
export const listFollowGraph = async (event: H3Event, direction: 'followers' | 'following') => {
  const viewer = await requireUser(event)
  const userId = getRouterParam(event, 'id') ?? ''
  if (!UUID_RE.test(userId)) throw createError({ statusCode: 400, statusMessage: 'Invalid user ID' })

  const page = Math.max(1, Number(getQuery(event).page) || 1)
  const service = getServiceClient()

  if (direction === 'following' && viewer.id !== userId) {
    const { data: owner } = await service.from('user').select('hide_following').eq('user_id', userId).maybeSingle()
    if (owner?.hide_following) {
      throw createError({ statusCode: 403, statusMessage: 'This user keeps the accounts they follow private' })
    }
  }

  const keyColumn = direction === 'followers' ? 'following_id' : 'follower_id'
  const otherColumn = direction === 'followers' ? 'follower_id' : 'following_id'

  const { data: edges, count, error } = await service
    .from('follows')
    .select('follower_id, following_id, created_at', { count: 'exact' })
    .eq(keyColumn, userId)
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not load the list' })

  const ids = (edges ?? []).map(edge => edge[otherColumn])
  const [{ data: rows }, relationships] = await Promise.all([
    ids.length
      ? service.from('user').select(DIRECTORY_COLUMNS).in('user_id', ids)
      : Promise.resolve({ data: [] as never[] }),
    loadRelationships(service, viewer.id, ids)
  ])
  const byId = new Map((rows ?? []).map(row => [row.user_id, toDirectoryProfile(row)]))

  return {
    success: true,
    data: ids.flatMap((id) => {
      const profile = byId.get(id)
      return profile ? [{ ...profile, relationship: relationships.get(id) }] : []
    }),
    total: count ?? 0,
    page,
    hasMore: page * PAGE_SIZE < (count ?? 0)
  }
}
