<!-- FILE: /pages/notifications.vue - FIXED FOR SSR HYDRATION -->
<!-- ============================================================================
     NOTIFICATIONS PAGE - FIXED: All user-specific notifications wrapped
     ✅ FIXED: Notifications list wrapped
     ✅ FIXED: User-specific data wrapped
     ============================================================================ -->

<template>
  <div class="notifications-page">
    <div class="page-header">
      <h3>Your Notifications</h3>
    </div>

    <!-- ✅ FIXED: Wrap entire notifications content in ClientOnly -->
    <ClientOnly>
      <div class="notifications-container">
        <ul v-if="notifications.length" class="notifications-list">
          <li v-for="note in notifications" :key="note.id" class="notification-item" :class="{ unread: !note.is_read }">
            <NuxtLink :to="linkFor(note)" class="notification-link">
              <span class="notification-icon"><Icon :name="metaFor(note).icon" size="18" /></span>
              <div class="notification-content">
                <strong class="notification-type">{{ metaFor(note).label }}</strong>
                <span class="notification-message">{{ note.message_text }}</span>
              </div>
            </NuxtLink>
            <small class="notification-time">{{ formatTime(note.created_at) }}</small>
          </li>
        </ul>
        <div v-else class="empty-state">
          <Icon name="bell-off" size="48" />
          <p>No notifications yet.</p>
        </div>
      </div>

      <!-- Fallback for SSR -->
      <template #fallback>
        <div class="notifications-loading">
          <div class="spinner"></div>
          <p>Loading notifications...</p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  middleware: ['auth', 'profile-completion', 'language-check'],
  layout: 'default'
})

// SEO
useHead({
  title: 'Notifications - Viorp',
  meta: [
    { name: 'description', content: 'View your notifications and updates' }
  ]
})

interface NotificationItem {
  id: string
  event_type: string
  notifier_id?: string | null
  source_id?: string | null
  message_text: string | null
  is_read: boolean | null
  created_at: string
}

const notifications = ref<NotificationItem[]>([])
const { markNotificationsRead } = useUnreadCounts()

onMounted(async () => {
  try {
    const res = await $fetch<{ data: NotificationItem[] }>('/api/user/notifications', { query: { limit: 50 } })
    notifications.value = res.data ?? []
    if (notifications.value.some(note => !note.is_read)) await markNotificationsRead()
  } catch (error) {
    console.error('Error loading notifications:', error)
  }
})

const EVENT_META: Record<string, { label: string, icon: string }> = {
  COMMENT_ADDED: { label: 'Comment', icon: 'message-circle' },
  COMMENT_REPLY: { label: 'Reply', icon: 'message-circle' },
  MENTION: { label: 'Mention', icon: 'message-circle' },
  TAG: { label: 'Tagged', icon: 'message-circle' },
  POST_LIKE: { label: 'Like', icon: 'heart' },
  GIFT_RECEIVED: { label: 'Gift', icon: 'gift' },
  MISSED_CALL: { label: 'Missed call', icon: 'phone-missed' },
  PAL_REQUEST: { label: 'PAL request', icon: 'user-plus' },
  PAL_ACCEPTED: { label: 'New PAL', icon: 'users' },
  FOLLOW_RECEIVED: { label: 'New follower', icon: 'user-plus' },
  STREAM_LIVE: { label: 'Live', icon: 'radio' },
  ESCROW_UPDATE: { label: 'Escrow', icon: 'alert-circle' },
  POST_SHARED: { label: 'Share', icon: 'repeat' },
  PAGE_FOLLOWED: { label: 'Page follower', icon: 'flag' },
  SYSTEM_ALERT: { label: 'Viorp', icon: 'bell' }
}

const metaFor = (note: NotificationItem) => EVENT_META[note.event_type] ?? { label: 'Update', icon: 'bell' }

const POST_EVENTS = new Set(['COMMENT_ADDED', 'COMMENT_REPLY', 'MENTION', 'TAG', 'POST_LIKE', 'GIFT_RECEIVED', 'POST_SHARED'])

const linkFor = (note: NotificationItem): string => {
  const lower = (note.message_text || '').toLowerCase()
  if (lower.includes('your status')) return '/my-status'
  if (lower.includes('their status') && note.notifier_id) return `/status?u=${note.notifier_id}`
  if (POST_EVENTS.has(note.event_type) && note.source_id) return `/posts/${note.source_id}`
  if (note.event_type === 'MISSED_CALL' && note.notifier_id) return `/chat?user=${note.notifier_id}`
  if (note.event_type.startsWith('PAL_')) return '/pal'
  if (note.event_type === 'FOLLOW_RECEIVED' && note.notifier_id) return `/profile/${note.notifier_id}`
  if (note.event_type === 'PAGE_FOLLOWED' && note.source_id) return `/pages/${note.source_id}`
  if (note.event_type === 'STREAM_LIVE' && note.source_id) return `/stream/${note.source_id}`
  if (note.event_type === 'GIFT_RECEIVED') return '/wallet'
  const text = (note.message_text || '').toLowerCase()
  if (text.includes('verif')) return '/profile'
  if (text.includes('ad ') || text.includes('campaign')) return note.source_id ? `/ads/${note.source_id}` : '/ads'
  if (text.includes('withdraw') || text.includes('wallet') || text.includes('deposit')) return '/wallet'
  return '/notifications'
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString()
}
</script>

<style scoped>
.notification-link { display: flex; align-items: flex-start; gap: 0.75rem; color: inherit; text-decoration: none; flex: 1; min-width: 0; }
.notification-icon { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; border-radius: 999px; background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.notification-content { min-width: 0; overflow-wrap: anywhere; }
.notification-type { margin-right: 0.35rem; color: #93c5fd; }
.notification-item.unread {
  border-left: 3px solid #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

.notifications-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: #0f172a;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h3 {
  font-size: 1.75rem;
  font-weight: bold;
  color: white;
}

.notifications-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: #cbd5e1;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.notifications-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.notification-item {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  transition: all 0.3s;
}

.notification-item:hover {
  border-color: #3b82f6;
  transform: translateX(4px);
}

.notification-content {
  margin-bottom: 0.5rem;
}

.notification-type {
  color: #3b82f6;
  font-weight: 700;
  margin-right: 0.5rem;
}

.notification-message {
  color: #e2e8f0;
}

.notification-time {
  display: block;
  font-size: 0.8rem;
  color: #94a3b8;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #94a3b8;
}

.empty-state p {
  margin-top: 1rem;
  font-size: 1.125rem;
}
</style>
