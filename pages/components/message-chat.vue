<template>
  <div class="chat-message">
    <span class="sender">{{ message.sender.name }}</span>
    <verified-badge-icon :user-id="message.sender.id" />
    <p>{{ message.text }}</p>
  </div>
</template>

<script setup>
import verifiedbadgeicon from '@/components/verified-badge-icon.vue'

defineProps({ 
  message: Object 
})
</script>

<style scoped>
.chat-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-bottom: 1px solid #e0e0e0;
}

.sender {
  font-weight: 600;
  color: #333;
}

p {
  margin: 0;
  flex: 1;
  word-break: break-word;
}
</style>
