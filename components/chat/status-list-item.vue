<!-- components/chat/StatusListItem.vue -->
<template>
  <div class="status-list-item" @click="handleViewStatus">
    <div class="status-avatar">
      <img 
        :src="status.avatar || '/default-avatar.png'" 
        :alt="status.username"
        :class="{ 'has-unviewed': status.hasUnviewed }"
      />
      <div v-if="status.hasUnviewed" class="unviewed-indicator"></div>
    </div>
    <div class="status-info">
      <div class="status-username">{{ status.username }}</div>
      <div class="status-time">{{ formatTime(status.lastStatusTime) }}</div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  status: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['view'])

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

const handleViewStatus = () => {
  emit('view', props.status)
}
</script>

<style scoped>
.status-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.status-list-item:hover {
  background: #f5f5f5;
}

.status-avatar {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.status-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.status-avatar img.has-unviewed {
  border-color: #1976d2;
}

.unviewed-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: #1976d2;
  border: 2px solid white;
  border-radius: 50%;
}

.status-info {
  flex: 1;
  min-width: 0;
}

.status-username {
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-time {
  font-size: 12px;
  color: #666;
}
</style>
