<script setup lang="ts">
// Pewgift now lives inside the wallet so deposits, withdrawals and gifting
// share one surface; this route stays as a permanent redirect for old links.
definePageMeta({
  middleware: ['auth', 'profile-completion', 'language-check'],
  layout: 'default'
})

await navigateTo({ path: '/wallet', query: { tab: 'Pewgift' } }, { redirectCode: 301 })
</script>

<template>
  <div />
</template>
