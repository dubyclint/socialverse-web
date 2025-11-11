<!-- pages/chat.vue -->
<template>
  <div class="chat-page">
    <ChatLayout />
  </div>
</template>

<script setup>
import chatlayout from '@/components/chat/chat-layout.vue'

// Set page meta
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// SEO
useHead({
  title: 'Chat - SocialVerse',
  meta: [
    { name: 'description', content: 'Private messaging and group chats on SocialVerse' }
  ]
})
</script>

<style scoped>
.chat-page {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #fff;
}
</style>
