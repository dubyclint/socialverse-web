<template>
  <div class="emoji-picker">
    <RecycleScroller
      class="emoji-grid"
      :items="filteredEmojis"
      :item-size="40"
      key-field="emoji"
      v-slot="{ item }"
    >
      <button @click="handleSelect(item.emoji)" class="emoji-btn">
        {{ item.emoji }}
      </button>
    </RecycleScroller>
  </div>
</template>

<script setup lang="ts">
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
// ... rest of your script
</script>

<style scoped>
.emoji-grid {
  height: 300px; /* Essential: The scroller needs a fixed height */
}
.emoji-btn { width: 40px; height: 40px; }
</style>
