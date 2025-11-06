<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">SocialVerse</h1>
        <p class="text-slate-400">Welcome back to the community</p>
      </div>

      <!-- Sign-In Form Component -->
      <SignInForm @success="handleSigninSuccess" />

      <!-- Sign-Up Link -->
      <div class="text-center mt-6">
        <p class="text-slate-400">
          Don't have an account?
          <button 
            @click="navigateToSignup"
            class="text-blue-500 hover:text-blue-400 font-semibold cursor-pointer bg-none border-none p-0"
          >
            Create one here
          </button>
        </p>
      </div>

      <!-- Forgot Password Link -->
      <div class="text-center mt-4">
        <NuxtLink to="/auth/forgot-password" class="text-slate-500 hover:text-slate-400 text-sm">
          Forgot your password?
        </NuxtLink>
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

const handleSigninSuccess = (data: any) => {
  console.log('[SignIn] Login successful, redirecting to home')
  router.push('/')
}

/**
 * Navigate to signup page with full page replacement
 * Uses router.push instead of NuxtLink to ensure proper navigation
 */
const navigateToSignup = () => {
  console.log('[SignIn] Navigating to signup page')
  router.push('/auth/signup')
}
</script>
