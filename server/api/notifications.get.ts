// server/api/notifications.get.ts
// ============================================================================
// GET NOTIFICATIONS
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const offset = parseInt(query.offset as string) || 0
    const unreadOnly = query.unread === 'true'

    const supabase = await serverSupabaseClient(event)

    let queryBuilder = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)

    if (unreadOnly) {
      queryBuilder = queryBuilder.eq('read', false)
    }

    const { data: notifications, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      success: true,
      data: notifications || []
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch notifications'
    })
  }
})
