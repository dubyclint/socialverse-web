// FILE: /server/api/presence/update.post.ts
// Update user presence status

import { PresenceModel } from '~/server/models/status'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    if (!user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const body = await readBody(event)
    const { status } = body

    const validStatuses = ['online', 'offline', 'away', 'busy']
    if (!status || !validStatuses.includes(status)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Status must be one of: ${validStatuses.join(', ')}`
      })
    }

    const presence = await PresenceModel.updatePresence(user.id, status)

    return {
      success: true,
      data: presence,
      message: `Presence updated to ${status}`
    }
  } catch (error: any) {
    console.error('[Presence Update] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to update presence'
    })
  }
})
