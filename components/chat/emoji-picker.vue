<template>
  <div class="emoji-picker">
    <RecycleScroller
      class="emoji-grid"
      :items="filteredEmojis"
      :item-size="40"
      key-field="emoji"
      v-slot="{ item }"
    >
      <button @click="handleSelect((item as EmojiItem).emoji)" class="emoji-btn">
        {{ (item as EmojiItem).emoji }}
      </button>
    </RecycleScroller>
  </div>
</template>

<script setup lang="ts">
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { useEmojiPicker } from '~/composables/use-emoji-picker'

interface EmojiItem {
  emoji: string
  name?: string
  category?: string
}

const { filteredEmojis, selectEmoji } = useEmojiPicker()

const emit = defineEmits<{
  select: [emoji: string]
}>()

const handleSelect = (emoji: string) => {
  selectEmoji(emoji)
  emit('select', emoji)
}
</script>

<style scoped>
.emoji-grid {
  height: 300px; /* Essential: The scroller needs a fixed height */
}
.emoji-btn { width: 40px; height: 40px; }
</style>
