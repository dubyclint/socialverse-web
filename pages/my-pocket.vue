<template>
  <div>
    <!-- ✅ WRAPPED WITH ClientOnly TO PREVENT HYDRATION MISMATCH -->
    <ClientOnly>
      <walletoverview />
      <cryptoswap />
    </ClientOnly>
    <!-- ✅ END OF ClientOnly WRAPPER -->
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth','profile-completion', 'language-check'],
  layout: 'default'
})
 
import walletoverview from '@/components/wallet-overview.vue'
import cryptoswap from '@/components/crypto-swap.vue'
</script>

