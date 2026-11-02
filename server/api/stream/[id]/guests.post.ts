import { readBody } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { enforceRateLimit } from '~/server/utils/rate-limit'
import { getLiveEligibility } from '~/server/utils/live-access'
import {
  activeCount, getGuest, GUEST_LIMITS, loadStreamOwner, pushGuests, setGuest, type GuestRole
} from '~/server/utils/stream-guests'
import { broadcastToStream } from '~/server/utils/stream-hub'

type Action = 'request' | 'cancel' | 'invite' | 'approve' | 'accept' | 'decline' | 'leave' | 'remove'

/**
 * Seat management for a LIVE. Viewers request a guest seat (host approves) or
 * the host invites a viewer as guest / another creator as co-host (they accept).
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const streamId = getRouterParam(event, 'id')
  const body = await readBody<{ action?: Action, userId?: string, role?: GuestRole }>(event)
  if (!streamId || !body?.action) throw createError({ statusCode: 400, statusMessage: 'Missing action' })
  await enforceRateLimit(event, 'stream:guests', { limit: 30, windowMs: 60_000 }, user.id)
  const stream = await loadStreamOwner(streamId)
  if (stream.broadcast_status !== 'LIVE') throw createError({ statusCode: 400, statusMessage: 'This LIVE has ended' })
  const isHost = stream.creator_id === user.id
  const { action } = body

  const ensureSeat = async (role: GuestRole) => {
    if (await activeCount(streamId, role) >= GUEST_LIMITS[role]) {
      throw createError({ statusCode: 409, statusMessage: role === 'cohost' ? 'Co-host mode allows up to 4 people on screen' : 'Multi-guest allows up to 8 guests' })
    }
  }

  if (action === 'request' || action === 'cancel' || action === 'accept' || action === 'decline' || action === 'leave') {
    if (isHost) throw createError({ statusCode: 400, statusMessage: 'You are the host' })
    const current = await getGuest(streamId, user.id)
    if (action === 'request') {
      if (current?.status === 'active') return { ok: true }
      await setGuest(streamId, user.id, 'guest', 'requested')
      broadcastToStream(streamId, { type: 'guest-request', userId: user.id })
    } else if (action === 'accept') {
      if (current?.status !== 'invited') throw createError({ statusCode: 400, statusMessage: 'No invitation to accept' })
      await ensureSeat(current.role)
      await setGuest(streamId, user.id, current.role, 'active')
    } else if (current) {
      await setGuest(streamId, user.id, current.role, action === 'decline' ? 'declined' : 'left')
    }
  } else {
    if (!isHost) throw createError({ statusCode: 403, statusMessage: 'Only the host manages guests' })
    const target = body.userId
    if (!target || target === user.id) throw createError({ statusCode: 400, statusMessage: 'Pick a viewer' })
    const current = await getGuest(streamId, target)
    if (action === 'invite') {
      const role: GuestRole = body.role === 'cohost' ? 'cohost' : 'guest'
      if (role === 'cohost') {
        const access = await getLiveEligibility(target)
        if (!access.canGoLive) throw createError({ statusCode: 400, statusMessage: 'Co-hosts must be creators who can go LIVE' })
      }
      await setGuest(streamId, target, role, 'invited')
      broadcastToStream(streamId, { type: 'guest-invite', userId: target, role })
    } else if (action === 'approve') {
      if (current?.status !== 'requested') throw createError({ statusCode: 400, statusMessage: 'No request from this viewer' })
      await ensureSeat('guest')
      await setGuest(streamId, target, 'guest', 'active')
    } else if (action === 'remove') {
      if (current) await setGuest(streamId, target, current.role, 'removed')
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Unknown action' })
    }
  }
  await pushGuests(streamId)
  return { ok: true }
})
