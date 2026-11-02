import { requireUser } from '~/server/utils/auth'
import { gameState } from '~/server/utils/stream-games'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const streamId = getRouterParam(event, 'id')
  if (!streamId) throw createError({ statusCode: 400, statusMessage: 'Stream id required' })
  return gameState(streamId)
})
