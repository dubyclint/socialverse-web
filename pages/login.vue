<template>
  <div></div>
</template>

<script setup lang="ts">
// Redirect to /auth/login
definePageMeta({
  layout: false,
})

const router = useRouter()

onMounted(() => {
  router.push('/auth/login')
})
</script>
