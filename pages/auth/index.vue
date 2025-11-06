<template>
  <!-- Redirect page - navigates to /auth/signup -->
  <div></div>
</template>

<script setup lang="ts">
/**
 * This page acts as a redirect to maintain backward compatibility
 * Old links to /auth will be redirected to /auth/signup
 */
definePageMeta({
  layout: 'blank',
  middleware: 'guest'
})

const router = useRouter()

onMounted(() => {
  console.log('[Auth Index] Redirecting /auth to /auth/signup')
  router.replace('/auth/signup')
})
</script>
