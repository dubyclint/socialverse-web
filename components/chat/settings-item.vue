<!-- components/chat/SettingsItem.vue -->
<template>
  <div 
    class="settings-item"
    :class="{ danger }"
    @click="$emit('click')"
  >
    <div class="item-icon">
      <Icon :name="icon" />
    </div>
    
    <div class="item-content">
      <div class="item-title">{{ title }}</div>
      <div class="item-subtitle" v-if="subtitle">{{ subtitle }}</div>
    </div>
    
    <div class="item-end">
      <div class="item-badge" v-if="badge">{{ badge }}</div>
      <Icon name="chevron-right" class="chevron" />
    </div>
  </div>
</template>

<script setup>
import Icon from '@/components/ui/Icon.vue'

// Props
const props = defineProps({
  icon: String,
  title: String,
  subtitle: String,
  badge: String,
  danger: Boolean
})

// Emits
const emit = defineEmits(['click'])
</script>

<style scoped>
.settings-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.settings-item:hover {
  background: rgba(0, 0, 0, 0.02);
}

.settings-item:last-child {
  border-bottom: none;
}

.settings-item.danger .item-title {
  color: #f44336;
}

.settings-item.danger .item-icon {
  color: #f44336;
}

.item-icon {
  width: 24px;
  height: 24px;
  color: #666;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.item-subtitle {
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-end {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.item-badge {
  background: #4caf50;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.chevron {
  width: 16px;
  height: 16px;
  color: #999;
}
</style>
