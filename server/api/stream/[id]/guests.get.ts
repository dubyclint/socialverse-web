import { requireUser } from '~/server/utils/auth'
import { listGuests, GUEST_LIMITS } from '~/server/utils/stream-guests'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const streamId = getRouterParam(event, 'id')
  if (!streamId) throw createError({ statusCode: 400, statusMessage: 'Stream id required' })
  return { guests: await listGuests(streamId), limits: GUEST_LIMITS }
})
