import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { StreamModel } from '~/server/models/stream'

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

  if (action === 'create') {
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
    return { success: true, message: 'Stream live', data: await StreamModel.startStream(streamId) }
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
