import { requireUser } from '~/server/utils/auth'
import { loadTargetedAds } from '~/server/utils/ads'

const PLACEMENTS = ['post_detail', 'profile', 'page', 'status'] as const

/** One targeted in-app ad for a non-feed placement (post detail, profile, Page). */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const placement = String(getQuery(event).placement ?? '')
  if (!PLACEMENTS.includes(placement as typeof PLACEMENTS[number])) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown placement' })
  }
  const limit = Math.min(3, Math.max(1, Number(getQuery(event).limit) || 1))
  const ads = await loadTargetedAds(event, user.id, limit)
  return { ad: ads[0] ?? null, ads }
})
