import { onBeforeUnmount, onMounted } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useSocket } from '~/composables/use-socket'
import { useRingtone } from '~/composables/use-ringtone'

const POLL_MS = 30_000
let subscribers = 0
let timer: ReturnType<typeof setInterval> | null = null
let channel: RealtimeChannel | null = null
let socketBound = false

/** System notification when the tab is in the background and the user allowed it. */
const notifyDevice = (title: string, body: string, url: string) => {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  if (document.visibilityState === 'visible') return
  void navigator.serviceWorker?.getRegistration().then((reg) => {
    if (reg) void reg.showNotification(title, { body, icon: '/icons/icon-192x192.png', tag: url, data: { url } })
    else new Notification(title, { body, icon: '/icons/icon-192x192.png' })
  })
}

// Browsers ignore permission prompts that aren't triggered by a user gesture.
if (typeof window !== 'undefined' && typeof Notification !== 'undefined' && Notification.permission === 'default') {
  const ask = () => {
    window.removeEventListener('pointerdown', ask)
    void Notification.requestPermission()
  }
  window.addEventListener('pointerdown', ask)
}

/** App-wide unread badges for notifications and chat, shared across headers and sidebars. */
export const useUnreadCounts = () => {
  const notifications = useState<number>('unread-notifications', () => 0)
  const chat = useState<number>('unread-chat', () => 0)
  const palRequests = useState<number>('pending-pal-requests', () => 0)
  const gifts = useState<number>('unread-gifts', () => 0)
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { socket } = useSocket()
  const ringtone = useRingtone()
  const route = useRoute()

  const refresh = async (): Promise<void> => {
    const [n, c, p] = await Promise.allSettled([
      $fetch<{ unread: number, gifts?: number }>('/api/user/notifications', { query: { limit: 1 } }),
      $fetch<{ total: number }>('/api/chat/unread'),
      $fetch<{ incoming?: unknown[] }>('/api/pals/requests')
    ])
    if (n.status === 'fulfilled') {
      notifications.value = n.value.unread ?? 0
      gifts.value = route.path === '/wallet' ? 0 : n.value.gifts ?? 0
    }
    if (c.status === 'fulfilled') chat.value = c.value.total ?? 0
    if (p.status === 'fulfilled') palRequests.value = p.value.incoming?.length ?? 0
  }

  const markGiftsSeen = async (): Promise<void> => {
    gifts.value = 0
    await $fetch('/api/notifications/read-gifts', { method: 'POST' }).catch(() => undefined)
  }

  const markNotificationsRead = async (): Promise<void> => {
    notifications.value = 0
    await $fetch('/api/notifications/read-all', { method: 'POST' })
  }

  const myId = () => {
    const u = user.value as { id?: string, sub?: string } | null
    return u?.id ?? u?.sub ?? null
  }

  const subscribe = () => {
    const id = myId()
    if (id && !channel) {
      channel = supabase
        .channel(`notifications:${id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${id}` }, (payload) => {
          const row = payload.new as { message_text?: string, event_type?: string }
          if (row.event_type === 'GIFT_RECEIVED' && route.path !== '/wallet') gifts.value += 1
          if (route.path !== '/notifications') notifications.value += 1
          if (useUserSettings().settings.value.notifications?.sound !== false) ringtone.ping('notify')
          notifyDevice('Viorp', row.message_text || 'You have a new notification', '/notifications')
        })
        .subscribe()
    }

    if (socket && !socketBound) {
      socketBound = true
      socket.on('chat:message', (msg: { senderId?: string, senderName?: string, content?: string }) => {
        if (!msg?.senderId || msg.senderId === myId()) return
        ringtone.ping('message')
        notifyDevice(msg.senderName || 'New message', msg.content || 'Sent an attachment', '/chat')
        setTimeout(() => void refresh(), 800)
      })
    }
  }

  const onVisible = () => {
    if (document.visibilityState === 'visible') void refresh()
  }

  /** Keeps the counts fresh while the calling component is mounted. */
  const track = () => {
    onMounted(() => {
      subscribers += 1
      void refresh()
      subscribe()
      if (!timer) {
        timer = setInterval(() => void refresh(), POLL_MS)
        document.addEventListener('visibilitychange', onVisible)
      }
    })
    onBeforeUnmount(() => {
      subscribers -= 1
      if (subscribers <= 0 && timer) {
        clearInterval(timer)
        timer = null
        document.removeEventListener('visibilitychange', onVisible)
        if (channel) void supabase.removeChannel(channel)
        channel = null
      }
    })
  }

  const label = (count: number) => (count > 99 ? '99+' : String(count))

  return { notifications, chat, palRequests, gifts, refresh, markNotificationsRead, markGiftsSeen, track, label }
}
