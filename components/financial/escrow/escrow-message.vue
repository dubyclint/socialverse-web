<!-- components/EscrowMessage.vue -->
<template>
  <div class="escrow-message">
    <p>{{ displayedText }}</p>
    <TranslationButton 
      :original-text="message.text" 
      :content-id="message.id"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface EscrowMessageData {
  id: string
  text: string
}

const props = defineProps<{ message: EscrowMessageData }>()
const displayedText = computed(() => props.message.text)
</script>
 
