<!-- components/chat/CallHistoryItem.vue -->
<template>
  <div class="call-history-item">
    <div class="call-avatar">
      <img 
        :src="call.contactAvatar || '/default-avatar.png'" 
        :alt="call.contactName"
      />
    </div>
    <div class="call-info">
      <div class="call-header">
        <div class="call-name">{{ call.contactName }}</div>
        <div class="call-time">{{ formatTime(call.timestamp) }}</div>
      </div>
      <div class="call-details">
        <Icon 
          :name="getCallIcon(call.type, call.status)" 
          :class="getCallIconClass(call.status)"
          size="14"
        />
        <span>{{ getCallStatusText(call.type, call.status) }}</span>
        <span v-if="call.duration" class="call-duration">{{ formatDuration(call.duration) }}</span>
      </div>
    </div>
    <button 
      class="callback-btn"
      @click="handleCallback"
      :title="`Call ${call.contactName}`"
    >
      <Icon name="phone" size="18" />
    </button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import Icon from '@/components/ui/Icon.vue'

const props = defineProps({
  call: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['callback'])

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

const formatDuration = (seconds) => {
  if (!seconds) return ''
  
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

const getCallIcon = (type, status) => {
  if (status === 'missed') return 'phone-missed'
  if (type === 'video') return 'video'
  return 'phone'
}

const getCallIconClass = (status) => {
  return {
    'call-icon': true,
    'missed': status === 'missed',
    'incoming': status === 'incoming',
    'outgoing': status === 'outgoing'
  }
}

const getCallStatusText = (type, status) => {
  if (status === 'missed') return 'Missed call'
  if (status === 'incoming') return 'Incoming'
  if (status === 'outgoing') return 'Outgoing'
  return type === 'video' ? 'Video call' : 'Voice call'
}

const handleCallback = () => {
  emit('callback', props.call)
}
</script>

<style scoped>
.call-history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.call-history-item:hover {
  background: #f5f5f5;
}

.call-avatar {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.call-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.call-info {
  flex: 1;
  min-width: 0;
}

.call-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.call-name {
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.call-time {
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
  margin-left: 8px;
}

.call-details {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.call-icon {
  flex-shrink: 0;
}

.call-icon.missed {
  color: #f44336;
}

.call-icon.incoming {
  color: #4caf50;
}

.call-icon.outgoing {
  color: #2196f3;
}

.call-duration {
  margin-left: 4px;
  color: #999;
}

.callback-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #e3f2fd;
  color: #1976d2;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.callback-btn:hover {
  background: #1976d2;
  color: white;
}
</style>
