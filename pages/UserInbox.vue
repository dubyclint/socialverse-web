<template>
  <div class="user-inbox">
    <div class="inbox-header">
      <h2>📧 Inbox</h2>
      <button @click="markAllRead" class="mark-read-btn">Mark All Read</button>
    </div>
    
    <div class="inbox-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab"
        @click="activeTab = tab"
        :class="{ active: activeTab === tab }"
        class="tab-btn"
      >
        {{ tab }}
      </button>
    </div>

    <div class="messages-list">
      <div v-if="filteredMessages.length === 0" class="no-messages">
        <p>No messages in {{ activeTab.toLowerCase() }}</p>
      </div>
      
      <div 
        v-for="message in filteredMessages" 
        :key="message.id"
        :class="['message-item', { unread: !message.read }]"
        @click="openMessage(message)"
      >
        <div class="message-avatar">
          <img :src="message.avatar" :alt="message.sender" />
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="sender">{{ message.sender }}</span>
            <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
          </div>
          <div class="message-preview">{{ message.preview }}</div>
          <div class="message-type">{{ message.type }}</div>
        </div>
        <div class="message-actions">
          <button @click.stop="deleteMessage(message.id)">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const activeTab = ref('All');
const tabs = ['All', 'Unread', 'Trade', 'Chat', 'System'];

const messages = ref([
  {
    id: 1,
    sender: 'TradeBot',
    avatar: 'https://via.placeholder.com/40',
    preview: 'Your trade request has been accepted',
    type: 'Trade',
    timestamp: Date.now() - 3600000,
    read: false
  },
  {
    id: 2,
    sender: 'Alice',
    avatar: 'https://via.placeholder.com/40',
    preview: 'Hey! Are you still interested in that item?',
    type: 'Chat',
    timestamp: Date.now() - 7200000,
    read: true
  },
  {
    id: 3,
    sender: 'System',
    avatar: 'https://via.placeholder.com/40',
    preview: 'Welcome to SocialVerse! Complete your profile...',
    type: 'System',
    timestamp: Date.now() - 86400000,
    read: false
  }
]);

const filteredMessages = computed(() => {
  if (activeTab.value === 'All') return messages.value;
  if (activeTab.value === 'Unread') return messages.value.filter(m => !m.read);
  return messages.value.filter(m => m.type === activeTab.value);
});

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString();
}

function markAllRead() {
  messages.value.forEach(m => m.read = true);
}

function openMessage(message) {
  message.read = true;
  // Navigate to full message view
  console.log('Opening message:', message);
}

function deleteMessage(id) {
  const index = messages.value.findIndex(m => m.id === id);
  if (index > -1) messages.value.splice(index, 1);
}

onMounted(() => {
  // Load messages from API
  console.log('Loading inbox messages...');
});
</script>

<style scoped>
.user-inbox {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.inbox-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.mark-read-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.inbox-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.tab-btn {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab-btn.active {
  border-bottom-color: #007bff;
  color: #007bff;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.message-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.message-item:hover {
  background-color: #f8f9fa;
}

.message-item.unread {
  background-color: #e3f2fd;
  border-left: 4px solid #007bff;
}

.message-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.message-content {
  flex: 1;
  margin-left: 1rem;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.sender {
  font-weight: bold;
}

.timestamp {
  color: #666;
  font-size: 0.875rem;
}

.message-preview {
  color: #333;
  margin-bottom: 0.25rem;
}

.message-type {
  font-size: 0.75rem;
  color: #007bff;
  background: #e3f2fd;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  display: inline-block;
}

.message-actions button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
}

.no-messages {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>
