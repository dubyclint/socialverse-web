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
          <NuxtLink to="/auth" class="text-blue-500 hover:text-blue-400 font-semibold">
            Create one here
          </NuxtLink>
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
  // Redirect to feed/dashboard
  router.push('/feed')
}
</script>

<style scoped>
/* Minimal scoped styles - rely on Tailwind */
</style>
