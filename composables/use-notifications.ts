// composables/useNotifications.ts
// ============================================================================
// NOTIFICATIONS COMPOSABLE
// ============================================================================

import { ref, computed } from 'vue'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
}

export const useNotifications = () => {
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  /**
   * Load notifications
   */
  const loadNotifications = async (unreadOnly = false) => {
    loading.value = true
    try {
      const response = await $fetch<any>('/api/notifications', {
        query: {
          unread: unreadOnly,
          limit: 50
        }
      })

      if (response.success) {
        notifications.value = response.data
      }
    } catch (error) {
      console.error('Load notifications error:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * Mark as read
   */
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await $fetch<any>(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      })

      if (response.success) {
        const notification = notifications.value.find(n => n.id === notificationId)
        if (notification) {
          notification.read = true
        }
      }
    } catch (error) {
      console.error('Mark as read error:', error)
    }
  }

  /**
   * Mark all as read
   */
  const markAllAsRead = async () => {
    try {
      const response = await $fetch<any>('/api/notifications/read-all', {
        method: 'POST'
      })

      if (response.success) {
        notifications.value.forEach(n => {
          n.read = true
        })
      }
    } catch (error) {
      console.error('Mark all as read error:', error)
    }
  }

  return {
    notifications,
    loading,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead
  }
}
