<template>
  <div>
    <universechat />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth','profile-completion', 'language-check'],
  layout: 'default'
})

import universechat from '@/components/universe-chat.vue'
</script>
