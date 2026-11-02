import { readBody } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { loadStreamOwner } from '~/server/utils/stream-guests'
import { cancelLiveGame, currentGame, finishGame, gameState, startGame } from '~/server/utils/stream-games'

/** Host starts, ends early or cancels the timed top-gift-getter game. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const streamId = getRouterParam(event, 'id')
  const body = await readBody<{ action?: 'start' | 'end' | 'cancel', durationSeconds?: number }>(event)
  if (!streamId) throw createError({ statusCode: 400, statusMessage: 'Stream id required' })
  const stream = await loadStreamOwner(streamId)
  if (stream.creator_id !== user.id) throw createError({ statusCode: 403, statusMessage: 'Only the host runs the gift game' })
  if (stream.broadcast_status !== 'LIVE') throw createError({ statusCode: 400, statusMessage: 'This LIVE has ended' })
  const live = await currentGame(streamId)
  if (body?.action === 'start') {
    if (live?.status === 'live' && Date.parse(live.ends_at) > Date.now()) throw createError({ statusCode: 409, statusMessage: 'A gift game is already running' })
    if (live?.status === 'live') await finishGame(live)
    const d = Math.round(Number(body.durationSeconds) || 0)
    if (d < 30 || d > 3600) throw createError({ statusCode: 400, statusMessage: 'Pick a time between 30 seconds and 60 minutes' })
    await startGame(streamId, user.id, d)
  } else if (body?.action === 'end' && live?.status === 'live') {
    await finishGame({ ...live, ends_at: new Date().toISOString() })
  } else if (body?.action === 'cancel') {
    await cancelLiveGame(streamId)
  }
  return gameState(streamId)
})
