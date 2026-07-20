// server/api/stream/[id].get.ts
import { StreamModel } from '~/server/models/stream'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Stream id required' })

  // Optional auth: allow anonymous viewers
  try { await requireAuth(event) } catch (e) { /* ignore */ }

  const result = await StreamModel.getStream(id)

    return { success: true, data: result }
  } catch (error: any) {
    console.error('[Stream Get] Error:', error)
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message || 'Failed to get stream' })
  }
});
