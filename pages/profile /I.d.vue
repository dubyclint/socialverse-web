<template>
  <div class="profile-header">
    <h2>{{ user.name }} <VerifiedBadgeIcon :userId="user.id" /></h2>
    <!-- other profile info -->
  </div>
</template>

<script setup>
import VerifiedBadgeIcon from '@/components/VerifiedBadgeIcon.vue'
const route = useRoute()
const user = await fetchUser(route.params.id) // your existing logic
</script>
