// server/api/stream/user.get.ts
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { StreamModel } from '~/server/models/stream'

export default defineEventHandler(async (event) => {
  try {
  const user = await requireAuth(event);
  const result = await StreamModel.getUserStreams((user as any)?.id)

    return {
      success: true,
      data: result
    }
  } catch (error: any) {
    console.error('Get user streams error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch user streams' })
  }
})
