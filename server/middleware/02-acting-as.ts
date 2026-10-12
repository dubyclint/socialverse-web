import { getRequestURL } from 'h3'
import { isActingAsPage, resolveActor } from '~/server/utils/actor'

// Engagement that is not Page-aware yet (gifts spend the personal wallet);
// a Page identity is refused so it can never surface as the person instead.
const PERSONAL_ONLY = [
  /^\/api\/posts\/[^/]+\/(pewgift|share|repost|report)(\/|$)/,
  /^\/api\/follows(\/|$)/,
  /^\/api\/pals(\/|$)/,
  /^\/api\/pewgift(\/|$)/,
  /^\/api\/pages\/[^/]+\/follow$/
]

export default defineEventHandler(async (event) => {
  if (!isActingAsPage(event)) return
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/')) return

  await resolveActor(event)

  if (event.method !== 'GET' && event.method !== 'HEAD' && PERSONAL_ONLY.some(re => re.test(path))) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Switch back to your personal profile to do this'
    })
  }
})
