<!-- FILE: /pages/auth/complete-profile.vue -->
<!-- Complete profile after signup with profile form -->

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
    <div class="w-full max-w-2xl">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">Complete Your Profile</h1>
        <p class="text-slate-400">Tell us more about yourself</p>
      </div>

      <!-- Profile Completion Form Component -->
      <EditProfile 
        :is-new-profile="true"
        @success="handleProfileSuccess" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import EditProfile from '~/components/profile/edit-profile.vue'

definePageMeta({
  layout: 'blank',
  middleware: 'auth'
})

const router = useRouter()

const handleProfileSuccess = () => {
  console.log('[Complete Profile Page] Profile completed successfully')
  console.log('[Complete Profile Page] Redirecting to /feed')
  
  // Redirect to feed/dashboard
  router.push('/feed')
}
</script>

<style scoped>
/* Minimal scoped styles - rely on Tailwind */
</style>
