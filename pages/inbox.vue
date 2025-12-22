<template>
  <div class="inbox-page">
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
            <label>Timeframe:</label>
            <select v-model="selectedTimeframe" class="filter-select">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <button @click="clearFilters" class="btn-text">Clear Filters</button>
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
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'language-check'],
  layout: 'default'
})
 
import { ref, computed, onMounted } from 'vue'

const notifications = ref([])
const showFilters = ref(false)
const selectedType = ref('all')
const selectedStatus = ref('all')
const selectedTimeframe = ref('all')
const loading = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(10)

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

  if (selectedType.value !== 'all') {
    filtered = filtered.filter(n => n.type === selectedType.value)
  }

  if (selectedStatus.value !== 'all') {
    filtered = filtered.filter(n => 
      selectedStatus.value === 'read' ? n.isRead : !n.isRead
    )
  }

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

const loadNotifications = async () => {
  try {
    notifications.value = [
      {
        id: 1,
        type: 'like',
        fromUser: 'John Doe',
        avatar: '/avatars/john.jpg',
        message: 'John Doe liked your post',
        preview: 'Just deployed my new app! 🚀',
        createdAt: new Date(Date.now() - 1000 * 60 * 5),
        isRead: false,
        actionUrl: '/post/123'
      },
      {
        id: 2,
        type: 'comment',
        fromUser: 'Jane Smith',
        avatar: '/avatars/jane.jpg',
        message: 'Jane Smith commented on your post',
        preview: 'Great work! Love the design.',
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        isRead: false,
        actionUrl: '/post/123'
      },
      {
        id: 3,
        type: 'follow',
        fromUser: 'Mike Johnson',
        avatar: '/avatars/mike.jpg',
        message: 'Mike Johnson started following you',
        preview: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        isRead: true,
        actionUrl: '/profile/mike-johnson'
      },
      {
        id: 4,
        type: 'mention',
        fromUser: 'Sarah Wilson',
        avatar: '/avatars/sarah.jpg',
        message: 'Sarah Wilson mentioned you in a comment',
        preview: '@you Check this out!',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
        isRead: true,
        actionUrl: '/post/456'
      },
      {
        id: 5,
        type: 'system',
        fromUser: 'SocialVerse',
        avatar: null,
        message: 'Your profile has been verified!',
        preview: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        isRead: true,
        actionUrl: '/settings'
      }
    ]
  } catch (error) {
    console.error('Error loading notifications:', error)
  }
}

const markAsRead = (id: number) => {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.isRead = true
  }
}

const markAllAsRead = () => {
  notifications.value.forEach(n => n.isRead = true)
}

const deleteNotification = (id: number) => {
  notifications.value = notifications.value.filter(n => n.id !== id)
}

const handleNotificationClick = (notification: any) => {
  if (!notification.isRead) {
    markAsRead(notification.id)
  }
  if (notification.actionUrl) {
    navigateTo(notification.actionUrl)
  }
}

const clearFilters = () => {
  selectedType.value = 'all'
  selectedStatus.value = 'all'
  selectedTimeframe.value = 'all'
}

const loadMore = () => {
  currentPage.value++
}

const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

const formatType = (type: string) => {
  const types: Record<string, string> = {
    like: 'Like',
    comment: 'Comment',
    follow: 'Follow',
    mention: 'Mention',
    system: 'System'
  }
  return types[type] || type
}

const getNotificationIcon = (type: string) => {
  const icons: Record<string, string> = {
    like: 'heart',
    comment: 'message-circle',
    follow: 'user-plus',
    mention: 'at-sign',
    system: 'bell'
  }
  return icons[type] || 'bell'
}

onMounted(() => {
  loadNotifications()
})
</script>

<style scoped>
.inbox-page {
  min-height: 100vh;
  background: #0f172a;
  padding: 2rem;
}

.inbox-container {
  max-width: 1200px;
  margin: 0 auto;
}

.inbox-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.inbox-header h1 {
  color: white;
  font-size: 2rem;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;
}

.btn-secondary:hover:not(:disabled) {
  background: #334155;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filters-panel {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  color: #cbd5e1;
  font-size: 0.875rem;
  font-weight: 500;
}

.filter-select {
  padding: 0.5rem 1rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: white;
  min-width: 150px;
}

.btn-text {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-weight: 500;
  padding: 0.5rem;
}

.inbox-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-item {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: white;
  margin-bottom: 0.5rem;
}

.stat-number.unread {
  color: #3b82f6;
}

.stat-label {
  color: #94a3b8;
  font-size: 0.875rem;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notification-item {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.notification-item:hover {
  border-color: #3b82f6;
  transform: translateX(4px);
}

.notification-item.unread {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
}

.notification-avatar {
  flex-shrink: 0;
}

.avatar-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.notification-message {
  color: white;
  font-weight: 500;
}

.notification-preview {
  color: #94a3b8;
  font-size: 0.875rem;
  font-style: italic;
}

.notification-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
}

.notification-time {
  color: #64748b;
}

.notification-type {
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.notification-type.like {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.notification-type.comment {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.notification-type.follow {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.notification-type.mention {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.notification-type.system {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.notification-actions {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.action-btn {
  padding: 0.5rem;
  background: #334155;
  border: none;
  border-radius: 6px;
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover {
  background: #475569;
  color: white;
}

.delete-btn:hover {
  background: #ef4444;
  color: white;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #64748b;
}

.empty-state h3 {
  color: #94a3b8;
  margin: 1rem 0 0.5rem;
}

.load-more-section {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .inbox-page {
    padding: 1rem;
  }

  .inbox-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .inbox-stats {
    grid-template-columns: 1fr;
  }

  .filters-panel {
    flex-direction: column;
  }

  .filter-select {
    width: 100%;
  }
}
</style>
