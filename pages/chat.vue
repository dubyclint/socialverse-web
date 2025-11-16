<!-- pages/chat.vue -->
<template>
  <div class="chat-page">
    <chatlayout />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'language-check'],
  layout: 'default'
})

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
