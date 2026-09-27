// FILE: /server/api/status/[id].delete.ts
// Delete a status

import { StatusModel } from '~/server/models/status'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    if (!user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const statusId = getRouterParam(event, 'id')

    if (!statusId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Status ID is required'
      })
    }

    // Use legacy alias which accepts (id, userId) and returns void
    await StatusModel.delete(statusId, user.id)

    return {
      success: true,
      message: 'Status deleted successfully'
    }
  } catch (error: any) {
    console.error('[Status Delete] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to delete status'
    })
  }
})
