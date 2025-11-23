<!-- components/EmojiPicker.vue -->
<!-- ============================================================================
     EMOJI PICKER COMPONENT
     ============================================================================ -->

<template>
  <div class="emoji-picker-wrapper">
    <!-- Trigger Button -->
    <button
      @click="togglePicker"
      class="emoji-trigger-btn"
      title="Add emoji"
      :disabled="disabled"
    >
      <Icon name="smile" size="20" />
    </button>

    <!-- Emoji Picker Popup -->
    <div v-if="showPicker" class="emoji-picker-popup">
      <!-- Search Bar -->
      <div class="emoji-search">
        <Icon name="search" size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search emoji..."
          class="emoji-search-input"
        />
      </div>

      <!-- Category Tabs -->
      <div class="emoji-categories">
        <button
          v-for="category in categories"
          :key="category"
          @click="selectCategory(category)"
          class="category-btn"
          :class="{ active: selectedCategory === category }"
          :title="category"
        >
          {{ getCategoryIcon(category) }}
        </button>
      </div>

      <!-- Emoji Grid -->
      <div class="emoji-grid">
        <button
          v-for="emoji in filteredEmojis"
          :key="emoji.emoji"
          @click="selectAndEmit(emoji.emoji)"
          class="emoji-btn"
          :title="emoji.name"
        >
          {{ emoji.emoji }}
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="filteredEmojis.length === 0" class="emoji-empty">
        No emojis found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEmojiPicker } from '~/composables/use-emoji-picker'

interface Props {
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  'emoji-selected': [emoji: string]
}>()

const {
  showPicker,
  selectedCategory,
  searchQuery,
  categories,
  filteredEmojis,
  togglePicker,
  selectCategory,
  selectEmoji
} = useEmojiPicker()

const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    smileys: '😀',
    hands: '👋',
    hearts: '❤️',
    objects: '🎉',
    nature: '🌟'
  }
  return icons[category] || '😀'
}

const selectAndEmit = (emoji: string) => {
  emit('emoji-selected', emoji)
  showPicker.value = false
}
</script>

<style scoped>
.emoji-picker-wrapper {
  position: relative;
}

.emoji-trigger-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  border-radius: 8px;
  transition: all 0.2s;
}

.emoji-trigger-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #2563eb;
}

.emoji-trigger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.emoji-picker-popup {
  position: absolute;
  bottom: 100%;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 320px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  margin-bottom: 8px;
}

.emoji-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
}

.search-icon {
  color: #9ca3af;
  flex-shrink: 0;
}

.emoji-search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #1f2937;
}

.emoji-search-input::placeholder {
  color: #9ca3af;
}

.emoji-categories {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
}

.category-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 8px;
  font-size: 18px;
  border-radius: 6px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.category-btn:hover {
  background: #f3f4f6;
}

.category-btn.active {
  background: #e3f2fd;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
  padding: 12px;
  overflow-y: auto;
  flex: 1;
}

.emoji-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 24px;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-btn:hover {
  background: #f3f4f6;
  transform: scale(1.2);
}

.emoji-empty {
  padding: 32px 12px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

/* Scrollbar styling */
.emoji-grid::-webkit-scrollbar {
  width: 6px;
}

.emoji-grid::-webkit-scrollbar-track {
  background: transparent;
}

.emoji-grid::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.emoji-grid::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
