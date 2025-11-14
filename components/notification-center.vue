<!-- components/NotificationCenter.vue -->
<!-- ============================================================================
     NOTIFICATION CENTER COMPONENT
     ============================================================================ -->

<template>
  <div class="notification-center">
    <!-- Notification Bell -->
    <button
      @click="toggleNotifications"
      class="notification-bell"
      :class="{ 'has-unread': unreadCount > 0 }"
    >
      <Icon name="bell" size="20" />
      <span v-if="unreadCount > 0" class="unread-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- Notifications Dropdown -->
    <div v-if="showNotifications" class="notifications-dropdown">
      <!-- Header -->
      <div class="notifications-header">
        <h3>Notifications</h3>
        <button
          v-if="unreadCount > 0"
          @click="markAllAsRead"
          class="mark-all-btn"
        >
          Mark all as read
        </button>
      </div>

      <!-- Notifications List -->
      <div class="notifications-list">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.read }"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon">
            <Icon :name="getNotificationIcon(notification.type)" size="20" />
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">{{ formatTime(notification.created_at) }}</div>
          </div>
          <button
            v-if="!notification.read"
            @click.stop="markAsRead(notification.id)"
            class="mark-read-btn"
          >
            <Icon name="check" size="16" />
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="notifications.length === 0" class="empty-state">
        <Icon name="inbox" size="32" />
        <p>No notifications</p>
      </div>

      <!-- View All Link -->
      <div class="notifications-footer">
        <NuxtLink to="/notifications" class="view-all-link">
          View all notifications
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNotifications } from '~/composables/use-notifications'

const {
  notifications,
  unreadCount,
  loadNotifications,
  markAsRead,
  markAllAsRead
} = useNotifications()

const showNotifications = ref(false)

const getNotificationIcon = (type: string): string => {
  const icons: Record<string, string> = {
    mention: 'at-sign',
    like: 'heart',
    comment: 'message-circle',
    share: 'share-2',
    follow: 'user-plus'
  }
  return icons[type] || 'bell'
}

const formatTime = (date: string): string => {
  const now = new Date()
  const notifDate = new Date(date)
  const diff = now.getTime() - notifDate.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return notifDate.toLocaleDateString()
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    loadNotifications()
  }
}

const handleNotificationClick = (notification: any) => {
  if (!notification.read) {
    markAsRead(notification.id)
  }
  // Navigate to related content
  if (notification.related_type === 'post') {
    navigateTo(`/posts/${notification.related_id}`)
  }
}

onMounted(() => {
  loadNotifications(true)
})
</script>

<style scoped>
.notification-center {
  position: relative;
}

.notification-bell {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #6b7280;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-bell:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.notification-bell.has-unread {
  color: #ef4444;
}

.unread-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}

.notifications-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 360px;
  max-height: 500px;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  margin-top: 8px;
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.notifications-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.mark-all-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #2563eb;
  font-size: 12px;
  font-weight: 500;
  transition: color 0.2s;
}

.mark-all-btn:hover {
  color: #1d4ed8;
}

.notifications-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item:hover {
  background: #f9fafb;
}

.notification-item.unread {
  background: #f0f7ff;
}

.notification-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e3f2fd;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  color: #1f2937;
  font-size: 13px;
  margin-bottom: 2px;
}

.notification-message {
  color: #6b7280;
  font-size: 12px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-time {
  color: #9ca3af;
  font-size: 11px;
}

.mark-read-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: #2563eb;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.mark-read-btn:hover {
  color: #1d4ed8;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: #9ca3af;
  text-align: center;
}

.empty-state p {
  margin: 12px 0 0 0;
  font-size: 13px;
}

.notifications-footer {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.view-all-link {
  color: #2563eb;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.2s;
}

.view-all-link:hover {
  color: #1d4ed8;
}

/* Scrollbar styling */
.notifications-list::-webkit-scrollbar {
  width: 6px;
}

.notifications-list::-webkit-scrollbar-track {
  background: transparent;
}

.notifications-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.notifications-list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
  
