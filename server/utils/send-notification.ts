// FILE: /server/utils/send-notification.ts
import type { H3Event } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'

/** Insert a system notification for `userId`; failures are logged, never thrown. */
export async function sendNotification(
  _event: H3Event | null,
  userId: string,
  _type: 'filter' | 'rematch' | 'group' | 'match' | 'system',
  message: string,
  notifierId: string | null = null,
  sourceId: string | null = null
): Promise<void> {
  const { error } = await getServiceClient().from('notifications').insert({
    recipient_id: userId,
    notifier_id: notifierId,
    event_type: 'SYSTEM_ALERT',
    source_id: sourceId,
    message_text: message,
    is_read: false
  } as never)
  if (error) console.error('[Notification] insert failed:', error.message)
}
