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

      <!-- Back Button / Help Link -->
      <div class="text-center mt-6 space-y-3">
        <p class="text-slate-400 text-sm">
          Having trouble?
        </p>
        <div class="flex gap-4 justify-center">
          <NuxtLink 
            to="/auth/signin" 
            class="text-slate-400 hover:text-white text-sm transition-colors"
          >
            ← Back to Sign In
          </NuxtLink>
          <span class="text-slate-600">•</span>
          <NuxtLink 
            to="/auth/signup" 
            class="text-slate-400 hover:text-white text-sm transition-colors"
          >
            Create New Account
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'blank',
  middleware: 'guest'
})

const router = useRouter()

/**
 * Handle successful email verification
 * The component will handle the redirect, but we can add additional logic here if needed
 */
const handleVerificationSuccess = () => {
  console.log('[VerifyEmailPage] Email verification successful')
  // The component already redirects to /auth/complete-profile
  // This is just a callback in case we need to do anything else
}
</script>

<style scoped>
/* Minimal scoped styles - rely on Tailwind */
</style>
