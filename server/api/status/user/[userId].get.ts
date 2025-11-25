// FILE: /server/api/status/user/[userId].get.ts
// Get user's active status

import { StatusModel } from '~/server/models/status'

export default defineEventHandler(async (event) => {
  try {
    const userId = getRouterParam(event, 'userId')

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    const status = await StatusModel.getActiveStatus(userId)

    if (!status) {
      return {
        success: true,
        data: null,
        message: 'No active status'
      }
    }

    const viewCount = await StatusModel.getStatusViewCount(status.id)

    return {
      success: true,
      data: {
        ...status,
        view_count: viewCount
      }
    }
  } catch (error: any) {
    console.error('[Status Get User] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to get user status'
    })
  }
})
