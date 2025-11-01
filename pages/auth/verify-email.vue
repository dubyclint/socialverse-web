<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">Verify Email</h1>
        <p class="text-slate-400">Confirm your email address to continue</p>
      </div>

      <!-- Email Verification Component -->
      <EmailVerification @success="handleVerificationSuccess" />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'blank',
  middleware: 'guest'
})

const router = useRouter()
const route = useRoute()

const handleVerificationSuccess = () => {
  // Redirect to profile completion
  router.push('/auth/complete-profile')
}
</script>

<style scoped>
/* Minimal scoped styles - rely on Tailwind */
</style>
