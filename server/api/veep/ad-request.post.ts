import { readBody } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { enforceRateLimit } from '~/server/utils/rate-limit'
import { loadTargetedAds } from '~/server/utils/ads'
import { currentDau, loadCreatorRevenueConfig, revenueDb } from '~/server/utils/creator-revenue'

/** Fired by the Veep player at the engaged mark (>= 6s): logs the ad request and picks house vs network ads by DAU. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await enforceRateLimit(event, 'veep:ad-request', { limit: 60, windowMs: 60_000 }, user.id)
  const body = await readBody<{ postId?: string, watchSeconds?: number }>(event)
  const cfg = await loadCreatorRevenueConfig()
  const watch = Math.max(0, Number(body?.watchSeconds) || 0)
  if (!body?.postId || watch < cfg.engaged_seconds) throw createError({ statusCode: 400, statusMessage: 'Not an engaged view yet' })
  const db = revenueDb()
  const { data: post } = await db.from('posts').select('user_id, page_id').eq('id', body.postId).maybeSingle()
  if (!post || post.page_id || post.user_id === user.id) return { adRequestId: null }
  const dau = await currentDau()
  const house = dau < cfg.dau_gate
  const { data: row, error } = await db.from('ad_revenue_events').insert({
    post_id: body.postId, creator_id: post.user_id, viewer_id: user.id, watch_time_seconds: watch, is_engaged_view: true,
    network_source: house ? 'internal_house' : 'appodeal', ad_type_served: house ? 'house_ad' : 'native_banner', fill_status: 'requested'
  }).select('ad_request_id').single()
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  const ad = house ? (await loadTargetedAds(event, user.id, 1))[0] ?? null : null
  return { adRequestId: row.ad_request_id, house, ad, timeoutMs: cfg.fill_timeout_ms }
})
