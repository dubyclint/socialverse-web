<template>
  <div class="moderation-panel">
    <div class="panel-header">
      <h3>Stream Moderation</h3>
      <button @click="togglePanel" class="toggle-btn">
        {{ isExpanded ? 'Collapse' : 'Expand' }}
      </button>
    </div>

    <div v-if="isExpanded" class="panel-content">
      <!-- Quick Actions -->
      <div class="quick-actions">
        <h4>Quick Actions</h4>
        <div class="action-buttons">
          <button @click="toggleChatMode" class="action-btn">
            {{ chatMode === 'open' ? 'Restrict Chat' : 'Open Chat' }}
          </button>
          <button @click="clearChat" class="action-btn danger">
            Clear Chat
          </button>
          <button @click="toggleSlowMode" class="action-btn">
            {{ slowMode ? 'Disable Slow Mode' : 'Enable Slow Mode' }}
          </button>
        </div>
      </div>

      <!-- Blocked Users -->
      <div class="blocked-users">
        <h4>Blocked Users ({{ blockedUsers.length }})</h4>
        <div class="user-list">
          <div 
            v-for="user in blockedUsers" 
            :key="user.blocked_user_id"
            class="user-item"
          >
            <div class="user-info">
              <span class="username">{{ getUserName(user.blocked_user_id) }}</span>
              <span class="block-reason">{{ user.reason }}</span>
            </div>
            <button 
              @click="unblockUser(user.blocked_user_id)"
              class="unblock-btn"
            >
              Unblock
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Moderation Actions -->
      <div class="recent-actions">
        <h4>Recent Actions</h4>
        <div class="action-list">
          <div 
            v-for="action in recentActions" 
            :key="action.id"
            class="action-item"
          >
            <div class="action-info">
              <span class="action-type">{{ formatActionType(action.action) }}</span>
              <span class="action-target">{{ getUserName(action.target_user_id) }}</span>
              <span class="action-time">{{ formatTime(action.timestamp) }}</span>
            </div>
            <div class="action-reason">{{ action.reason }}</div>
          </div>
        </div>
      </div>

      <!-- Privacy Settings -->
      <div class="privacy-settings">
        <h4>Privacy Settings</h4>
        <div class="settings-grid">
          <label class="setting-item">
            <input 
              v-model="privacySettings.isPrivate" 
              type="checkbox"
              @change="updatePrivacySettings"
            >
            <span>Private Stream</span>
          </label>
          
          <label class="setting-item">
            <input 
              v-model="privacySettings.requireApproval" 
              type="checkbox"
              @change="updatePrivacySettings"
            >
            <span>Require Viewer Approval</span>
          </label>
          
          <div class="setting-item">
            <label>Chat Mode:</label>
            <select 
              v-model="privacySettings.chatMode" 
              @change="updatePrivacySettings"
            >
              <option value="open">Open to All</option>
              <option value="followers_only">Followers Only</option>
              <option value="subscribers_only">Subscribers Only</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Word Filter -->
      <div class="word-filter">
        <h4>Word Filter</h4>
        <div class="filter-controls">
          <input 
            v-model="newBannedWord" 
            placeholder="Add banned word..."
            @keyup.enter="addBannedWord"
          >
          <button @click="addBannedWord" class="add-btn">Add</button>
        </div>
        <div class="banned-words">
          <span 
            v-for="word in bannedWords" 
            :key="word"
            class="banned-word"
          >
            {{ word }}
            <button @click="removeBannedWord(word)" class="remove-word">×</button>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  streamId: String
})

const isExpanded = ref(false)
const chatMode = ref('open')
const slowMode = ref(false)
const blockedUsers = ref([])
const recentActions = ref([])
const newBannedWord = ref('')
const bannedWords = ref(['spam', 'scam', 'hate'])

const privacySettings = ref({
  isPrivate: false,
  requireApproval: false,
  chatMode: 'open'
})

const togglePanel = () => {
  isExpanded.value = !isExpanded.value
}

const toggleChatMode = async () => {
  const newMode = chatMode.value === 'open' ? 'followers_only' : 'open'
  chatMode.value = newMode
  
  try {
    await $fetch(`/api/moderation/chat-mode`, {
      method: 'POST',
      body: {
        streamId: props.streamId,
        mode: newMode
      }
    })
  } catch (error) {
    console.error('Failed to update chat mode:', error)
  }
}

const clearChat = async () => {
  if (confirm('Are you sure you want to clear all chat messages?')) {
    try {
      await $fetch(`/api/moderation/clear-chat`, {
        method: 'POST',
        body: { streamId: props.streamId }
      })
    } catch (error) {
      console.error('Failed to clear chat:', error)
    }
  }
}

const toggleSlowMode = async () => {
  slowMode.value = !slowMode.value
  
  try {
    await $fetch(`/api/moderation/slow-mode`, {
      method: 'POST',
      body: {
        streamId: props.streamId,
        enabled: slowMode.value
      }
    })
  } catch (error) {
    console.error('Failed to toggle slow mode:', error)
  }
}

const unblockUser = async (userId) => {
  try {
    await $fetch(`/api/moderation/unblock`, {
      method: 'POST',
      body: {
        streamId: props.streamId,
        userId
      }
    })
    
    // Remove from local list
    blockedUsers.value = blockedUsers.value.filter(
      user => user.blocked_user_id !== userId
    )
  } catch (error) {
    console.error('Failed to unblock user:', error)
  }
}

const updatePrivacySettings = async () => {
  try {
    await $fetch(`/api/moderation/privacy`, {
      method: 'POST',
      body: {
        streamId: props.streamId,
        settings: privacySettings.value
      }
    })
  } catch (error) {
    console.error('Failed to update privacy settings:', error)
  }
}

const addBannedWord = async () => {
  if (newBannedWord.value.trim() && !bannedWords.value.includes(newBannedWord.value)) {
    bannedWords.value.push(newBannedWord.value.trim())
    newBannedWord.value = ''
    
    try {
      await $fetch(`/api/moderation/banned-words`, {
        method: 'POST',
        body: {
          streamId: props.streamId,
          words: bannedWords.value
        }
      })
    } catch (error) {
      console.error('Failed to update banned words:', error)
    }
  }
}

const removeBannedWord = async (word) => {
  bannedWords.value = bannedWords.value.filter(w => w !== word)
  
  try {
    await $fetch(`/api/moderation/banned-words`, {
      method: 'POST',
      body: {
        streamId: props.streamId,
        words: bannedWords.value
      }
    })
  } catch (error) {
    console.error('Failed to update banned words:', error)
  }
}

const loadModerationData = async () => {
  try {
    const response = await $fetch(`/api/moderation/dashboard/${props.streamId}`)
    if (response.success) {
      blockedUsers.value = response.dashboard.blockedUsers
      recentActions.value = response.dashboard.recentActions
    }
  } catch (error) {
    console.error('Failed to load moderation data:', error)
  }
}

const formatActionType = (action) => {
  const types = {
    'message_blocked': 'Message Blocked',
    'user_banned': 'User Banned',
    'user_blocked': 'User Blocked',
    'chat_cleared': 'Chat Cleared'
  }
  return types[action] || action
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}

const getUserName = (userId) => {
  return `User ${userId.slice(-4)}`
}

onMounted(() => {
  loadModerationData()
})
</script>

<style scoped>
.moderation-panel {
  background: #1a1a1a;
  border-radius: 12px;
  padding: 20px;
  color: white;
  margin-bottom: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toggle-btn {
  background: #3d3d3d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.toggle-btn:hover {
  background: #4d4d4d;
}

.quick-actions {
  margin-bottom: 30px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.action-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.action-btn:hover {
  background: #059669;
}

.action-btn.danger {
  background: #ef4444;
}

.action-btn.danger:hover {
  background: #dc2626;
}

.blocked-users, .recent-actions {
  margin-bottom: 30px;
}

.user-list, .action-list {
  max-height: 200px;
  overflow-y: auto;
  margin-top: 12px;
}

.user-item, .action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #2d2d2d;
  border-radius: 6px;
  margin-bottom: 8px;
}

.user-info, .action-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.username, .action-type {
  font-weight: bold;
}

.block-reason, .action-target, .action-time {
  font-size: 12px;
  color: #888;
}

.unblock-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.privacy-settings {
  margin-bottom: 30px;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.setting-item select {
  background: #2d2d2d;
  color: white;
  border: 1px solid #4d4d4d;
  padding: 4px 8px;
  border-radius: 4px;
}

.word-filter {
  margin-bottom: 20px;
}

.filter-controls {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  margin-bottom: 12px;
}

.filter-controls input {
  flex: 1;
  background: #2d2d2d;
  color: white;
  border: 1px solid #4d4d4d;
  padding: 8px 12px;
  border-radius: 6px;
}

.add-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.banned-words {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.banned-word {
  background: #ef4444;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.remove-word {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}
</style>
