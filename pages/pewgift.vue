<template>
  <div>
    <PewgiftSummary />
    <PewgiftHistory :user-id="userId" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth','profile-completion', 'language-check'],
  layout: 'default'
})

import { computed } from 'vue'
import { useUserStore } from '~/stores/user'
import PewgiftSummary from '@/components/financial/gifts/pewgift-summary.vue'
import PewgiftHistory from '@/components/financial/gifts/pewgift-history.vue'

const userStore = useUserStore()
const userId = computed(() => userStore.user?.id ?? '')
</script>
