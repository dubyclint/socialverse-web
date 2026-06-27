// FILE: /server/api/status/[id].get.ts
// Get a specific status

import { StatusModel } from '~/server/models/status'

export default defineEventHandler(async (event) => {
  try {
    const statusId = getRouterParam(event, 'id')

    if (!statusId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Status ID is required'
      })
    }

    const { db } = await import('~/server/utils/database')
    const { data: status, error } = await db
      .from('user_statuses')
      .select('*')
      .eq('id', statusId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !status) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Status not found'
      })
    }

    const viewCount = await StatusModel.getStatusViewCount(statusId)

    const user = await requireAuth(event)
    if (user?.id && user.id !== status.user_id) {
      await StatusModel.recordStatusView(statusId, user.id)
    }

    return {
      success: true,
      data: {
        ...status,
        view_count: viewCount
      }
    }
  } catch (error: any) {
    console.error('[Status Get] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to get status'
    })
  }
})
