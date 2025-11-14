<!-- components/gift-history.vue - COMPLETE FIXED VERSION -->

<template>
  <div class="gift-history">
    <div class="history-header">
      <h3>🎁 Gift History</h3>
      <div class="filter-tabs">
        <button
          v-for="tab in tabs"
          :key="tab"
          @click="activeTab = tab"
          class="filter-tab"
          :class="{ active: activeTab === tab }"
        >
          {{ tab }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      ⏳ Loading gift history...
    </div>

    <div v-else-if="filteredGifts.length === 0" class="empty-state">
      <p>No gifts yet. Start spreading joy! 🎁</p>
    </div>

    <div v-else class="gifts-list">
      <div v-for="gift in filteredGifts" :key="gift.id" class="gift-item">
        <div class="gift-avatar">
          <img
            v-if="gift.sender?.avatar_url"
            :src="gift.sender.avatar_url"
            :alt="gift.sender.username"
            class="avatar"
          />
          <span v-else class="avatar-placeholder">👤</span>
        </div>

        <div class="gift-details">
          <div class="gift-header">
            <span class="gift-emoji">{{ gift.gift_type?.emoji }}</span>
            <span class="gift-name">{{ gift.gift_type?.name }}</span>
            <span class="gift-quantity">x{{ gift.quantity }}</span>
          </div>

          <div class="gift-info">
            <span v-if="gift.sender_id === userId" class="direction sent">
              Sent to {{ gift.recipient?.username }}
            </span>
            <span v-else class="direction received">
              Received from {{ gift.sender?.username }}
            </span>
            <span class="timestamp">{{ formatDate(gift.created_at) }}</span>
          </div>

          <div v-if="gift.message" class="gift-message">
            💬 {{ gift.message }}
          </div>

          <div v-if="gift.is_anonymous" class="anonymous-badge">
            🔒 Anonymous
          </div>
        </div>

        <div class="gift-value">
          <span class="value-amount">{{ gift.gift_type?.price_in_credits * gift.quantity }} PEW</span>
          <span class="value-label">Value</span>
        </div>
      </div>
    </div>

    <div v-if="hasMore" class="load-more">
      <button @click="loadMore" :disabled="loading">
        {{ loading ? 'Loading...' : 'Load More' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  userId: {
    type: String,
    required: true
  }
})

const activeTab = ref('all')
const gifts = ref([])
const loading = ref(false)
const offset = ref(0)
const hasMore = ref(true)
const limit = 20

const tabs = ['all', 'sent', 'received']

const filteredGifts = computed(() => {
  if (activeTab.value === 'sent') {
    return gifts.value.filter(g => g.sender_id === props.userId)
  }
  if (activeTab.value === 'received') {
    return gifts.value.filter(g => g.recipient_id === props.userId)
  }
  return gifts.value
})

onMounted(() => {
  loadGiftHistory()
})

const loadGiftHistory = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/pewgift/history', {
      query: {
        userId: props.userId,
        limit,
        offset: offset.value
      }
    })

    if (response.success) {
      gifts.value = response.data || []
      hasMore.value = response.data?.length === limit
    }
  } catch (error) {
    console.error('Failed to load gift history:', error)
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  offset.value += limit
  loading.value = true
  try {
    const response = await $fetch('/api/pewgift/history', {
      query: {
        userId: props.userId,
        limit,
        offset: offset.value
      }
    })

    if (response.success) {
      gifts.value.push(...(response.data || []))
      hasMore.value = response.data?.length === limit
    }
  } catch (error) {
    console.error('Failed to load more gifts:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`

  return date.toLocaleDateString()
}
</script>

<style scoped>
.gift-history {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.history-header {
  margin-bottom: 20px;
}

.history-header h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #333;
}

.filter-tabs {
  display: flex;
  gap: 10px;
}

.filter-tab {
  padding: 8px 16px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.filter-tab:hover {
  border-color: #ff6b6b;
}

.filter-tab.active {
  background: #ff6b6b;
  color: white;
  border-color: #ff6b6b;
}

.loading,
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.gifts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gift-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #ff6b6b;
  transition: all 0.2s;
}

.gift-item:hover {
  background: #fff5f5;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.1);
}

.gift-avatar {
  flex-shrink: 0;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: #e0e0e0;
  border-radius: 50%;
  font-size: 24px;
}

.gift-details {
  flex: 1;
}

.gift-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.gift-emoji {
  font-size: 20px;
}

.gift-name {
  font-weight: bold;
  color: #333;
}

.gift-quantity {
  background: #ff6b6b;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.gift-info {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.direction {
  font-weight: 500;
}

.direction.sent {
  color: #4CAF50;
}

.direction.received {
  color: #2196F3;
}

.timestamp {
  color: #999;
}

.gift-message {
  font-size: 13px;
  color: #666;
  font-style: italic;
  margin-bottom: 8px;
  padding: 8px;
  background: white;
  border-radius: 4px;
}

.anonymous-badge {
  display: inline-block;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.gift-value {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.value-amount {
  font-weight: bold;
  color: #ff6b6b;
  font-size: 16px;
}

.value-label {
  font-size: 11px;
  color: #999;
}

.load-more {
  text-align: center;
  margin-top: 20px;
}

.load-more button {
  padding: 10px 20px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.load-more button:hover:not(:disabled) {
  background: #ff5252;
}

.load-more button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

