// FILE: /server/api/status/[id].delete.ts
// Delete a status

import { StatusModel } from '~/server/models/status'

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

    const deleted = await StatusModel.deleteStatus(statusId, user.id)

    if (!deleted) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Status not found or unauthorized'
      })
    }

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
