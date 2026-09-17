// server/api/stream/index.post.ts
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { StreamModel } from '~/server/models/stream'

function validateBody(body: any, fields: string[]) {
  for (const f of fields) {
    if (body[f] === undefined || body[f] === null) {
      throw createError({ statusCode: 400, statusMessage: `Missing required field: ${f}` })
    }
  }
}

export default defineEventHandler(async (event) => {
  try {
  const user = await requireAuth(event)
    const body = await readBody(event)
    const { action } = body

    validateBody(body, ['action'])

    let result: any = null

    if (action === 'create') {
      validateBody(body, ['title'])
      result = await StreamModel.createStream((user as any)?.id, body.title, body.streamUrl || '', body.description)
    } else if (action === 'update') {
      validateBody(body, ['stream_id'])
      result = await StreamModel.updateViewerCount(body.stream_id, body.viewerCount || 0)
    } else if (action === 'delete') {
      validateBody(body, ['stream_id'])
      result = await StreamModel.endStream(body.stream_id)
    } else {
      throw createError({ statusCode: 400, statusMessage: `Unknown action: ${action}` })
    }

    return {
      success: true,
      message: `Stream ${action} successful`,
      data: result
    }
  } catch (error: any) {
    console.error('Stream operation error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Stream operation failed' })
  }
})
