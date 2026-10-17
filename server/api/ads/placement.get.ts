import { requireUser } from '~/server/utils/auth'
import { loadTargetedAds } from '~/server/utils/ads'

const PLACEMENTS = ['post_detail', 'profile', 'page'] as const

/** One targeted in-app ad for a non-feed placement (post detail, profile, Page). */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const placement = String(getQuery(event).placement ?? '')
  if (!PLACEMENTS.includes(placement as typeof PLACEMENTS[number])) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown placement' })
  }
  const [ad] = await loadTargetedAds(event, user.id, 1)
  return { ad: ad ?? null }
})
