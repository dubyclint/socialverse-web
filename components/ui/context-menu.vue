<!-- components/ui/ContextMenu.vue -->
<template>
  <div 
    class="context-menu"
    :style="{ left: x + 'px', top: y + 'px' }"
    @click.stop
  >
    <div 
      v-for="item in items"
      :key="item.id"
      class="menu-item"
      :class="{ danger: item.danger }"
      @click="handleItemClick(item.id)"
    >
      <Icon :name="item.icon" v-if="item.icon" />
      <span>{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import icon from './icon.vue'

// Props
const props = defineProps({
  x: Number,
  y: Number,
  items: Array
})

// Emits
const emit = defineEmits(['select', 'close'])

// Methods
const handleItemClick = (itemId) => {
  emit('select', itemId)
}

const handleClickOutside = (event) => {
  emit('close')
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 150px;
  z-index: 2000;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item.danger {
  color: #f44336;
}

.menu-item.danger:hover {
  background: #ffebee;
}

.menu-item svg {
  width: 16px;
  height: 16px;
}
</style>
