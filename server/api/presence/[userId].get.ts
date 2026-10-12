// FILE: /server/api/presence/[userId].get.ts
// Get user presence status

import { PresenceModel } from '~/server/models/status'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'

export default defineEventHandler(async (event) => {
  try {
    const userId = getRouterParam(event, 'userId')

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    const viewer = await requireUser(event)
    const { data: owner } = await getServiceClient()
      .from('user')
      .select('show_online')
      .eq('user_id', userId)
      .maybeSingle()
    const hidden = owner?.show_online === false && viewer.id !== userId
    const presence = hidden ? null : await PresenceModel.getPresence(userId)

    if (!presence) {
      return {
        success: true,
        data: {
          user_id: userId,
          status: 'offline',
          last_seen: null,
          updated_at: null
        },
        message: 'User has no presence record'
      }
    }

    return {
      success: true,
      data: presence
    }
  } catch (error: any) {
    console.error('[Presence Get] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to get presence'
    })
  }
})
