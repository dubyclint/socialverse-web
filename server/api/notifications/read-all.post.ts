// server/api/notifications/[id]/read.post.ts
// ============================================================================
// MARK NOTIFICATION AS READ
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const notificationId = getRouterParam(event, 'id')

    const supabase = await serverSupabaseClient(event)

    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) throw error

    return {
      success: true,
      message: 'Notification marked as read'
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to mark notification as read'
    })
  }
})
