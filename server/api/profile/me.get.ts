import type { H3Event } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { loadOwnProfile } from '~/server/utils/own-profile'

/** The caller's profile, or null when the row has not been created yet. */
export default defineEventHandler(async (event: H3Event) => {
  const user = await requireUser(event)
  return await loadOwnProfile(user.id)
})
