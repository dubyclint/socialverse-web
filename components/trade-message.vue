 
<!-- components/TradeMessage.vue -->
<template>
  <div class="trade-message">
    <p>{{ displayedText }}</p>
    <TranslationButton 
      :original-text="message.content" 
      :content-id="message.id"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface TradeMessageData {
  id: string
  content: string
}

const props = defineProps<{ message: TradeMessageData }>()
const displayedText = computed(() => props.message.content)
</script>
 
