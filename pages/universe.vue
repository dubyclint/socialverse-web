<template>
  <div>
    <universechat />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth','profile-completion', 'language-check', 'admin-only'],
  layout: 'default'
})

import universechat from '@/components/universe-chat.vue'
</script>
