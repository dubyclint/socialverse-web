import { onBeforeUnmount, onMounted } from 'vue'

const POLL_MS = 30_000
let subscribers = 0
let timer: ReturnType<typeof setInterval> | null = null

/** App-wide unread badges for notifications and chat, shared across headers and sidebars. */
export const useUnreadCounts = () => {
  const notifications = useState<number>('unread-notifications', () => 0)
  const chat = useState<number>('unread-chat', () => 0)

  const refresh = async (): Promise<void> => {
    const [n, c] = await Promise.allSettled([
      $fetch<{ unread: number }>('/api/user/notifications', { query: { limit: 1 } }),
      $fetch<{ total: number }>('/api/chat/unread')
    ])
    if (n.status === 'fulfilled') notifications.value = n.value.unread ?? 0
    if (c.status === 'fulfilled') chat.value = c.value.total ?? 0
  }

  const markNotificationsRead = async (): Promise<void> => {
    notifications.value = 0
    await $fetch('/api/notifications/read-all', { method: 'POST' })
  }

  const onVisible = () => {
    if (document.visibilityState === 'visible') void refresh()
  }

  /** Keeps the counts fresh while the calling component is mounted. */
  const track = () => {
    onMounted(() => {
      subscribers += 1
      void refresh()
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
      }
    })
  }

  const label = (count: number) => (count > 99 ? '99+' : String(count))

  return { notifications, chat, refresh, markNotificationsRead, track, label }
}
