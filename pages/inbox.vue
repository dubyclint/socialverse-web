<template>
  <div class="inbox-page">
    <!-- ✅ WRAPPED WITH ClientOnly TO PREVENT HYDRATION MISMATCH -->
    <ClientOnly>
      <div class="inbox-container">
        <!-- Header -->
        <div class="inbox-header">
          <h1>Inbox</h1>
          <div class="header-actions">
            <button @click="markAllAsRead" class="btn-secondary" :disabled="unreadCount === 0">
              Mark All Read
            </button>
            <button @click="showFilters = !showFilters" class="btn-secondary">
              <Icon name="filter" size="16" />
              Filters
            </button>
          </div>
        </div>

        <!-- Filters Panel -->
        <div v-if="showFilters" class="filters-panel">
          <div class="filter-group">
            <label>Type:</label>
            <select v-model="selectedType" class="filter-select">
              <option value="all">All Types</option>
              <option value="like">Likes</option>
              <option value="comment">Comments</option>
              <option value="follow">Follows</option>
              <option value="mention">Mentions</option>
              <option value="system">System</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Status:</label>
            <select v-model="selectedStatus" class="filter-select">
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Time:</label>
            <select v-model="selectedTimeframe" class="filter-select">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        <!-- Stats -->
        <div class="inbox-stats">
          <div class="stat-item">
            <span class="stat-number">{{ totalNotifications }}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat-item">
            <span class="stat-number unread">{{ unreadCount }}</span>
            <span class="stat-label">Unread</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ todayCount }}</span>
            <span class="stat-label">Today</span>
          </div>
        </div>

        <!-- Notifications List -->
        <div class="notifications-list">
          <div v-if="filteredNotifications.length === 0" class="empty-state">
            <Icon name="inbox" size="64" />
            <h3>No notifications</h3>
            <p v-if="hasActiveFilters">Try adjusting your filters to see more notifications.</p>
            <p v-else>You're all caught up! New notifications will appear here.</p>
          </div>

          <div 
            v-for="notification in paginatedNotifications" 
            :key="notification.id"
            :class="['notification-item', { 'unread': !notification.isRead }]"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-avatar">
              <img 
                v-if="notification.avatar"
                :src="notification.avatar" 
                :alt="notification.fromUser"
                class="avatar-img"
              />
              <div v-else class="avatar-placeholder">
                <Icon :name="getNotificationIcon(notification.type)" size="20" />
              </div>
            </div>

            <div class="notification-content">
              <div class="notification-text">
                <span class="notification-message">{{ notification.message }}</span>
                <span v-if="notification.preview" class="notification-preview">
                  "{{ notification.preview }}"
                </span>
              </div>
              <div class="notification-meta">
                <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
                <span :class="['notification-type', notification.type]">
                  {{ formatType(notification.type) }}
                </span>
              </div>
            </div>

            <div class="notification-actions">
              <button 
                v-if="!notification.isRead"
                @click.stop="markAsRead(notification.id)"
                class="action-btn"
                title="Mark as read"
              >
                <Icon name="check" size="16" />
              </button>
              <button 
                @click.stop="deleteNotification(notification.id)"
                class="action-btn delete-btn"
                title="Delete"
              >
                <Icon name="trash-2" size="16" />
              </button>
            </div>
          </div>
        </div>

        <!-- Load More -->
        <div v-if="hasMoreNotifications" class="load-more-section">
          <button @click="loadMore" class="btn-secondary" :disabled="loading">
            {{ loading ? 'Loading...' : 'Load More' }}
          </button>
        </div>
      </div>
    </ClientOnly>
    <!-- ✅ END OF ClientOnly WRAPPER -->
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'language-check'],
  layout: 'default'
})
 
import { ref, computed, onMounted } from 'vue'

// Reactive data
const notifications = ref([])
const showFilters = ref(false)
const selectedType = ref('all')
const selectedStatus = ref('all')
const selectedTimeframe = ref('all')
const loading = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Computed properties
const totalNotifications = computed(() => notifications.value.length)

const unreadCount = computed(() => 
  notifications.value.filter(n => !n.isRead).length
)

const todayCount = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return notifications.value.filter(n => 
    new Date(n.createdAt) >= today
  ).length
})

const hasActiveFilters = computed(() => 
  selectedType.value !== 'all' || 
  selectedStatus.value !== 'all' || 
  selectedTimeframe.value !== 'all'
)

const filteredNotifications = computed(() => {
  let filtered = [...notifications.value]

  // Filter by type
  if (selectedType.value !== 'all') {
    filtered = filtered.filter(n => n.type === selectedType.value)
  }

  // Filter by status
  if (selectedStatus.value !== 'all') {
    filtered = filtered.filter(n => 
      selectedStatus.value === 'read' ? n.isRead : !n.isRead
    )
  }

  // Filter by timeframe
  if (selectedTimeframe.value !== 'all') {
    const now = new Date()
    let cutoff

    switch (selectedTimeframe.value) {
      case 'today':
        cutoff = new Date(now)
        cutoff.setHours(0, 0, 0, 0)
        break
      case 'week':
        cutoff = new Date(now)
        cutoff.setDate(cutoff.getDate() - 7)
        break
      case 'month':
        cutoff = new Date(now)
        cutoff.setMonth(cutoff.getMonth() - 1)
        break
    }

    if (cutoff) {
      filtered = filtered.filter(n => new Date(n.createdAt) >= cutoff)
    }
  }

  // Sort by creation date (newest first)
  return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const paginatedNotifications = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = currentPage.value * itemsPerPage.value
  return filteredNotifications.value.slice(start, end)
})

const hasMoreNotifications = computed(() => 
  paginatedNotifications.value.length < filteredNotifications.value.length
)

// Methods
const loadNotifications = async () => {
  try {
    // Mock data - replace with actual API call
    notifications.value = [
      {
        id: 1,
        type: 'like',
        fromUser: 'John Doe',
        avatar: '/avatars/john.jpg',
        message: 'John Doe liked your post',
        preview: 'Just deployed my new app! 🚀',
        createdAt: new Date(Date.now() - 1000 * 60 * ),
        isRead: false,
        actionUrl: '/post/123'
      },
      {
        id: 2,
        type: 'comment',
        fromUser: 'Jane Smith',
        avatar: '/avatars/jane.jpg',
        message: 'Jane Smith commented on your post',
        preview: 'Great work! How did you implement the authentication?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        isRead: false,
        actionUrl: '/post/#comment-'
      },
      {
        id: 3,
        type: 'follow',
        fromUser: 'Mike Johnson',
        avatar: '/avatars/mike.jpg',
        message: 'Mike Johnson started following you',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 *),
        isRead: true,
        actionUrl: '/profile/mikejohnson'
      },
      {
        id: 4,
        type: 'mention',
        fromUser: 'Sarah Wilson',
        avatar: '/avatars/sarah.jpg',
        message: 'Sarah Wilson mentioned you in a post',
        preview: 'Thanks @username for the inspiration!',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        isRead: true,
        actionUrl: '/post/789'
      },
      {
        id: 5,
        type: 'system',
        message: 'Your post has been featured in trending!',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        isRead:,
        actionUrl: '/trending'
      }
    ]
  } catch (error) {
    console.error('Error loading notifications:', error)
  }
}

const handleNotificationClick = (notification) => {
  // Mark as read if unread
  if (!notification.isRead) {
    markAsRead(notification.id)
  }

  // Navigate to the action URL
  if (notification.actionUrl) {
    navigateTo(notification.actionUrl)
  }
}

const markAsRead = (notificationId) => {
  const notification = notifications.value.find(n => n.id === notificationId)
  if (notification) {
    notification.isRead = true
    // API call would go here
  }
}

const markAllAsRead = async () => {
  try {
    notifications.value.forEach(notification => {
      notification.isRead = true
    })
    // API call would go here
  } catch (error) {
    console.error('Error marking all as read:', error)
  }
}

const deleteNotification = async (notificationId) => {
  try {
    notifications.value = notifications.value.filter(n => n.id !== notificationId)
    // API call would go here
  } catch (error) {
    console.error('Error deleting notification:', error)
  }
}

const loadMore = () => {
  currentPage.value++
}

const getNotificationIcon = (type) => {
  const icons = {
    like: 'heart',
    comment: 'message-circle',
    follow: 'user-plus',
    mention: 'at-sign',
    system: 'bell'
  }
  return icons[type] || 'bell'
}

const formatType = (type) => {
  const types = {
    like: 'Like',
    comment: 'Comment',
    follow: 'Follow',
    mention: 'Mention',
    system: 'System'
  }
  return types[type] || type
}

const formatTime = (date) => {
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

// Lifecycle
onMounted(() => {
  loadNotifications()
})
</script>

<style scoped>
.inbox-page {
  max-width: 800px;
  margin: 0 auto;
  padding: rem 1rem;
}

.inbox-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.inbox-header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight:;
  color: #1f2937;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filters-panel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  min-width: 120px;
}

.inbox-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-number.unread {
  color: #3b82f6;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap:.5rem;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.notification-item:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.notification-item.unread {
  background: #eff6ff;
  border-color: #3b82f6;
}

.notification-item.unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width:px;
  background: #3b82f6;
  border-radius: 0.5rem 0 0 0.5rem;
}

.notification-avatar {
  position: relative;
}

.avatar-img,
.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.avatar-img {
  object-fit: cover;
}

.avatar-placeholder {
  background: #ff4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-text {
  margin-bottom: 0.5rem;
}

.notification-message {
  color: #1f2937;
  font-weight: 500;
}

.notification-preview {
  display: block;
  color: #6b7280;
  font-style: italic;
  margin-top: 0.25rem;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.notification-time {
  font-size: 0.875rem;
  color: #6b7280;
}

.notification-type {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  border-radius:999px;
}

.notification-type.like {
  background: #fecaca;
  color: #991b1b;
}

.notification-type.comment {
  background: #dbeafe;
  color: #1e40af;
}

.notification-type.follow {
  background: #d1fae5;
  color: #065f46;
}

.notification-type.mention {
  background: #fef3c7;
  color: #92400e;
}

.notification-type.system {
  background: #ee7ff;
  color: #3a3;
}

.notification-actions {
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.notification-item:hover .notification-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #d1d5db;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
}

.delete-btn:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fca5a5;
}

.empty-state {
  text-align: center;
  padding: rem rem;
  color: #6b7280;
}

.empty-state h3 {
  margin:rem 0 0.5rem 0;
  color: #1f2937;
}

.load-more-section {
  text-align: center;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .inbox-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .filters-panel {
    flex-direction: column;
    gap: 1rem;
  }

  .inbox-stats {
    justify-content: center;
  }

  .notification-item {
    position: relative;
    padding-left: 1.5rem;
  }

  .notification-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
