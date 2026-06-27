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
          <li v-for="note in notifications" :key="note._id" class="notification-item">
            <div class="notification-content">
              <strong class="notification-type">{{ note.type.toUpperCase() }}:</strong> 
              <span class="notification-message">{{ note.message }}</span>
            </div>
            <small class="notification-time">{{ formatTime(note.timestamp) }}</small>
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
  title: 'Notifications - SocialVerse',
  meta: [
    { name: 'description', content: 'View your notifications and updates' }
  ]
})

const notifications = ref([])

onMounted(async () => {
  try {
    const res = await fetch('/api/user/notifications')
    notifications.value = await res.json()
  } catch (error) {
    console.error('Error loading notifications:', error)
  }
})

function formatTime(ts) {
  return new Date(ts).toLocaleString()
}
</script>

<style scoped>
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
