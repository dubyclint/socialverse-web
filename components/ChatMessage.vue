<template>
  <div class="chat-message">
    <span class="sender">{{ message.sender.name }}</span>
    <VerifiedBadgeIcon :userId="message.sender.id" />
    <p>{{ message.text }}</p>
  </div>
</template>

<script setup>
import VerifiedBadgeIcon from '@/components/VerifiedBadgeIcon.vue'
defineProps({ message: Object })
</script>
