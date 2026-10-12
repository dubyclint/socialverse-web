import { getRequestURL } from 'h3'
import { isActingAsPage, resolveActor } from '~/server/utils/actor'

// Public engagement that is still recorded against the personal account; a
// Page identity is refused so it can never surface as the person instead.
const PERSONAL_ONLY = [
  /^\/api\/posts\/[^/]+\/(like|pewgift|share|repost|comments|report)(\/|$)/,
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
