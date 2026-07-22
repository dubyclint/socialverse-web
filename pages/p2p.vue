<template>
  <div>
    <p2ptradeform />
    <tradechat />
    <escrowstatus />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth','profile-completion', 'language-check'],
  layout: 'default'
})
 
import p2ptradeform from '@/components/financial/p2p/p2p-trade-form.vue'
import tradechat from '@/components/trade-chat.vue'
import escrowstatus from '@/components/financial/escrow/escrow-status.vue'
</script>
