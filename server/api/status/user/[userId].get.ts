// FILE: /server/api/status/user/[userId].get.ts
// Get user's active status

import { StatusModel } from '~/server/models/status'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { canSeeStatus } from '~/server/utils/status-privacy'

export default defineEventHandler(async (event) => {
  try {
    const viewer = await requireUser(event)
    const userId = getRouterParam(event, 'userId')

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    if (!await canSeeStatus(getServiceClient(), viewer.id, userId)) {
      return { success: true, data: null, message: 'No active status' }
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
