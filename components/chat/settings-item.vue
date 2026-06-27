<!-- components/chat/settings-item.vue -->
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
import Icon from '@/components/ui/icon.vue'

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
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 16px 12px;
}

.settings-item.danger {
  color: #f44336;
}

.settings-item.danger:hover {
  background-color: #ffebee;
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: #f0f0f0;
  border-radius: 8px;
  flex-shrink: 0;
  color: #1976d2;
}

.settings-item.danger .item-icon {
  background-color: #ffebee;
  color: #f44336;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-weight: 500;
  color: #333;
  font-size: 15px;
  margin-bottom: 4px;
}

.settings-item.danger .item-title {
  color: #f44336;
}

.item-subtitle {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.item-end {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.item-badge {
  background-color: #4caf50;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chevron {
  color: #ccc;
  width: 20px;
  height: 20px;
}

.settings-item:hover .chevron {
  color: #1976d2;
}

.settings-item.danger:hover .chevron {
  color: #f44336;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .settings-item {
    padding: 12px 0;
  }

  .settings-item:hover {
    padding: 12px 8px;
  }

  .item-icon {
    width: 36px;
    height: 36px;
  }

  .item-title {
    font-size: 14px;
  }

  .item-subtitle {
    font-size: 12px;
  }
}
</style>
