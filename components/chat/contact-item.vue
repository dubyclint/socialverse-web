<!-- components/chat/ContactItem.vue -->
<template>
  <div 
    class="contact-item"
    :class="{ selected: isSelected }"
    @click="$emit('toggle', contact)"
  >
    <div class="contact-avatar">
      <img 
        :src="contact.avatar || '/default-avatar.png'" 
        :alt="contact.username"
      />
      <div 
        v-if="contact.isOnline" 
        class="online-indicator"
      ></div>
    </div>
    
    <div class="contact-info">
      <div class="contact-name">
        {{ contact.username }}
        <Icon v-if="contact.isVerified" name="check-circle" class="verified-icon" />
      </div>
      <div class="contact-status">
        {{ contact.isOnline ? 'Online' : formatLastSeen(contact.lastSeen) }}
      </div>
    </div>
    
    <div class="contact-action">
      <div class="checkbox" :class="{ checked: isSelected }">
        <Icon name="check" v-if="isSelected" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDistanceToNow } from 'date-fns'
import Icon from '@/components/ui/Icon.vue'

// Props
const props = defineProps({
  contact: Object,
  isSelected: Boolean
})

// Emits
const emit = defineEmits(['toggle'])

// Methods
const formatLastSeen = (timestamp) => {
  if (!timestamp) return 'Last seen a while ago'
  return `Last seen ${formatDistanceToNow(new Date(timestamp), { addSuffix: true })}`
}
</script>

<style scoped>
.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.contact-item:hover {
  background: #f5f5f5;
}

.contact-item.selected {
  background: #e3f2fd;
}

.contact-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.contact-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #4caf50;
  border: 2px solid white;
  border-radius: 50%;
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-name {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.verified-icon {
  width: 14px;
  height: 14px;
  color: #1976d2;
  flex-shrink: 0;
}

.contact-status {
  font-size: 12px;
  color: #666;
}

.contact-action {
  flex-shrink: 0;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.checkbox.checked {
  background: #1976d2;
  border-color: #1976d2;
  color: white;
}

.checkbox svg {
  width: 12px;
  height: 12px;
}
</style>
