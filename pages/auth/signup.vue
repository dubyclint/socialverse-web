<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">SocialVerse</h1>
        <p class="text-slate-400">Create your account and join the community</p>
      </div>

      <!-- Sign-Up Form Component -->
      <SignUpForm @success="handleSignupSuccess" />

      <!-- Sign-In Link -->
      <div class="text-center mt-6">
        <p class="text-slate-400">
          Already have an account?
          <NuxtLink 
            to="/auth/signin"
            class="text-blue-500 hover:text-blue-400 font-semibold"
          >
            Sign in here
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

definePageMeta({
  layout: 'blank',
  middleware: 'guest'
})

const router = useRouter()

const handleSignupSuccess = (data: any) => {
  console.log('[SignUp] Account created successfully, redirecting to email verification')
  // Redirect to email verification page
  router.push({
    path: '/auth/verify-email',
    query: { email: data.email }
  })
}
</script>

<style scoped>
/* Minimal styles - inherited from global */
</style>
