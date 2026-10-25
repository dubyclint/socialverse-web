<template>
  <div />
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
await navigateTo('/settings?tab=live', { replace: true })
</script>
