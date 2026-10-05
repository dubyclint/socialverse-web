// FILE: /server/api/follows/[userId].post.ts
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { enforceRateLimit } from '~/server/utils/rate-limit'
import { loadBlockedIds } from '~/server/utils/pals'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface FollowBody {
  /** Desired final state; omitted toggles. Explicit state makes retries idempotent. */
  follow?: boolean
  /** Legacy shape: 'follow' | 'unfollow' | 'toggle'. */
  action?: 'follow' | 'unfollow' | 'toggle'
}

/** Follows or unfollows a user; counters and the notification come from a DB trigger. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const targetId = getRouterParam(event, 'userId')?.trim() ?? ''
  if (!UUID_RE.test(targetId)) throw createError({ statusCode: 400, statusMessage: 'Invalid user ID' })
  if (targetId === user.id) throw createError({ statusCode: 400, statusMessage: 'You cannot follow yourself' })

  await enforceRateLimit(event, 'follows:toggle', { limit: 60, windowMs: 60_000 }, user.id)

  const body = await readBody<FollowBody>(event).catch(() => null)
  const service = getServiceClient()

  const [{ data: target }, { data: existing }, blocked] = await Promise.all([
    service.from('user').select('user_id').eq('user_id', targetId).maybeSingle(),
    service.from('follows').select('id').eq('follower_id', user.id).eq('following_id', targetId).maybeSingle(),
    loadBlockedIds(service, user.id)
  ])
  if (!target) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  const isFollowing = Boolean(existing)
  let desired = !isFollowing
  if (typeof body?.follow === 'boolean') desired = body.follow
  else if (body?.action === 'follow') desired = true
  else if (body?.action === 'unfollow') desired = false

  if (desired && blocked.has(targetId)) {
    throw createError({ statusCode: 403, statusMessage: 'You cannot follow this user' })
  }

  if (desired && !isFollowing) {
    const { error } = await service.from('follows').insert({ follower_id: user.id, following_id: targetId })
    if (error && error.code !== '23505') throw createError({ statusCode: 500, statusMessage: 'Could not follow user' })
  } else if (!desired && isFollowing) {
    const { error } = await service.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId)
    if (error) throw createError({ statusCode: 500, statusMessage: 'Could not unfollow user' })
  }

  const { count } = await service
    .from('follows')
    .select('id', { count: 'exact', head: true })
    .eq('following_id', targetId)

  return {
    success: true,
    following: desired,
    action: desired === isFollowing ? 'no_change' : desired ? 'followed' : 'unfollowed',
    followers_count: count ?? 0
  }
})
