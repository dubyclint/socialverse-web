import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { StreamModel } from '~/server/models/stream'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { assertAllowed } from '~/server/utils/staff'
import { getLiveEligibility } from '~/server/utils/live-access'

type StreamAction = 'create' | 'start' | 'end' | 'viewers'

const requireOwnership = async (streamId: string, userId: string) => {
  const stream = await StreamModel.getStream(streamId)
  if (!stream) throw createError({ statusCode: 404, statusMessage: 'Stream not found' })
  if (stream.creator_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Not your stream' })
  }
  return stream
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{
    action?: StreamAction
    stream_id?: string
    streamId?: string
    title?: string
    description?: string
    viewerCount?: number
  }>(event)

  const action = body?.action
  const streamId = body?.stream_id || body?.streamId

  if (!action) throw createError({ statusCode: 400, statusMessage: 'Missing required field: action' })

  const requireLiveAccess = async () => {
    await assertAllowed(user.id, 'stream')
    const access = await getLiveEligibility(user.id)
    if (!access.canGoLive) {
      throw createError({
        statusCode: 403,
        statusMessage: access.mode === 'denied'
          ? 'Live streaming has been disabled on your account.'
          : 'Your free live trial is used up. See the live requirements to keep going live.',
        data: { mode: access.mode }
      })
    }
    return access
  }

  if (action === 'create') {
    await requireLiveAccess()
    if (!body.title?.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'Missing required field: title' })
    }
    const stream = await StreamModel.createStream(user.id, body.title.trim(), '', body.description)
    return { success: true, message: 'Stream created', data: stream }
  }

  if (!streamId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required field: stream_id' })
  }

  await requireOwnership(streamId, user.id)

  if (action === 'start') {
    const access = await requireLiveAccess()
    const service = getServiceClient()
    const now = new Date()
    // One live broadcast per user at a time.
    await service.from('streams').update({ broadcast_status: 'ENDED', ended_at: now.toISOString(), current_viewer_count: 0 })
      .eq('creator_id', user.id).eq('broadcast_status', 'LIVE').neq('id', streamId)
    const isTrial = access.mode === 'trial'
    const { data, error } = await service.from('streams').update({
      broadcast_status: 'LIVE',
      started_at: now.toISOString(),
      access_mode: access.mode,
      trial_deadline: isTrial ? new Date(now.getTime() + access.trialSecondsLeft * 1000).toISOString() : null
    } as never).eq('id', streamId).select().single()
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    return {
      success: true,
      message: 'Stream live',
      data,
      access: { mode: access.mode, trialSecondsLeft: isTrial ? access.trialSecondsLeft : null }
    }
  }

  if (action === 'end') {
    return { success: true, message: 'Stream ended', data: await StreamModel.endStream(streamId) }
  }

  if (action === 'viewers') {
    await StreamModel.updateViewerCount(streamId, Math.max(0, Number(body.viewerCount) || 0))
    return { success: true, message: 'Viewer count updated', data: null }
  }

  throw createError({ statusCode: 400, statusMessage: `Unknown action: ${action}` })
})
