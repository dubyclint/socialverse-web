<template>
  <div></div>
</template>

<script setup lang="ts">
// ✅ FIXED - Redirect to /auth/login immediately
// Using navigateTo() which works during setup phase

definePageMeta({
  layout: false,
})

// Redirect immediately during setup, not after mount
await navigateTo('/auth/login')
</script>
