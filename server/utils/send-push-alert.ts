import { getServiceClient } from './supabase-admin'
import { sendFcm } from './fcm'

/** Pushes a notification to the user's registered device; clears tokens FCM reports as dead. */
export async function sendPushAlert(
  userId: string,
  title: string,
  body: string,
  options: { data?: Record<string, string>, channel?: string, ttl?: number, dataOnly?: boolean } = {}
): Promise<boolean> {
  try {
    const admin = getServiceClient()
    const { data: user } = await admin.from('user').select('push_token').eq('user_id', userId).maybeSingle()
    const token = user?.push_token
    if (!token) return false
    const result = await sendFcm({ token, title, body, ...options })
    if (result === 'invalid') await admin.from('user').update({ push_token: null }).eq('user_id', userId)
    return result === 'sent'
  } catch (error) {
    console.error('Error sending push alert:', error)
    return false
  }
}
