// FILE: /server/utils/send-notification.ts
// ============================================================================
// SEND NOTIFICATION UTILITY - Updated to use H3 context
// ============================================================================

import type { H3Event } from 'h3'
import { getDBAdmin } from './db-helpers'

export async function sendNotification(
  event: H3Event,
  userId: string, 
  type: 'filter' | 'rematch' | 'group' | 'match' | 'system', 
  message: string
): Promise<void> {
  try {
    const supabase = await getDBAdmin(event)
    
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
