// push-engine.ts
import axios from 'axios'

interface PushNotificationPayload {
  to: string
  notification: {
    title: string
    body: string
  }
}

interface PushEngineExports {
  sendPush: (deviceToken: string, title: string, body: string) => Promise<void>
}

const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY

export const sendPush = async (deviceToken: string, title: string, body: string): Promise<void> => {
  const payload: PushNotificationPayload = {
    to: deviceToken,
    notification: { title, body }
  }

  try {
    await axios.post('https://fcm.googleapis.com/fcm/send', payload, {
      headers: {
        Authorization: `key=${FCM_SERVER_KEY}`,
        'Content-Type': 'application/json'
      }
    })
  } catch (error: any) {
    console.error('Error sending push notification:', error.message)
    throw error
  }
}

export default {
  sendPush
} as PushEngineExports
