// ============================================================================
// MARK NOTIFICATION AS READ
// ============================================================================
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    // 1. Authenticate (Assumes requireAuth handles session check)
    const user = await requireAuth(event)
    const notificationId = getRouterParam(event, 'id')

    const supabase = await serverSupabaseClient(event)

    // 2. Update with schema-specific columns: is_read and recipient_id
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        // Optional: Add a read_at column if you want to track when it was read
        // read_at: new Date().toISOString() 
      })
      .eq('id', notificationId)
      .eq('recipient_id', user.id) // Correct column name based on your schema

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
