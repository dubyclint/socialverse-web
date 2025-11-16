<template>
  <div>
    <walletoverview />
    <cryptoswap />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'language-check'],
  layout: 'default'
})
 
import walletoverview from '@/components/wallet-overview.vue'
import cryptoswap from '@/components/crypto-swap.vue'
</script>
