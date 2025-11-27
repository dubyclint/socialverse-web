// FILE: /server/utils/send-notification.ts - UPDATED
// ============================================================================

import { dbAdmin } from './database'

export async function sendNotification(
  userId: string, 
  type: 'filter' | 'rematch' | 'group' | 'match' | 'system', 
  message: string
): Promise<void> {
  try {
    // ✅ NOW USE ASYNC FUNCTION
    const supabase = await dbAdmin()
    
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        message,
        timestamp: new Date().toISOString(),
        read: false
      })
      
    if (error) {
      console.error('Failed to send notification:', error.message)
      throw error
    }

    console.log(`[Notification] Sent to user ${userId}`)
  } catch (error) {
    console.error('[Notification] Error:', error)
    throw error
  }
}
