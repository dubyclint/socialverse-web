<template>
  <div>
    <giftsummary />
    <gifthistory />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth','profile-completion', 'language-check'],
  layout: 'default'
})

import pewgiftsummary from '@/components/pewgift-summary.vue'
import pewgifthistory from '@/components/pewgift-history.vue'
</script>
