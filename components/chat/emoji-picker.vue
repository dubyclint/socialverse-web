<template>
  <div class="emoji-picker-container">
    <div class="emoji-picker">
      <div class="categories">
        <button v-for="cat in categories" :key="cat.id" 
                @click="activeCategory = cat.id"
                :class="{ active: activeCategory === cat.id }">
          {{ cat.icon }}
        </button>
      </div>

      <div class="emoji-grid">
        <button v-for="e in filteredEmojis" :key="e.emoji" @click="handleSelect(e.emoji)">
          {{ e.emoji }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEmojiPicker } from '~/composables/use-emoji-picker'

const emit = defineEmits(['select'])
const { activeCategory, filteredEmojis, categories, addRecent } = useEmojiPicker()

const handleSelect = (char: string) => {
  addRecent(char)
  emit('select', char)
}
</script>
