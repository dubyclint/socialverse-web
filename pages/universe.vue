<template>
  <div>
    <palrequest />
    <pallist />
    <universechat />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth','profile-completion', 'language-check'],
  layout: 'default'
})

import palrequest from '@/components/pal-request.vue'
import pallist from '@/components/pal-list.vue'
import universechat from '@/components/universe-chat.vue'
</script>
