<!-- FILE: /pages/auth/signup.vue - COMPLETE FIXED VERSION -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-block">
          <h1 class="text-4xl font-bold text-white mb-2">🌐 SocialVerse</h1>
        </NuxtLink>
        <p class="text-slate-300">Join the community today</p>
      </div>

      <!-- Signup Form Card -->
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
        <h2 class="text-2xl font-bold text-white mb-6 text-center">Create Account</h2>

        <form @submit.prevent="handleSignup" class="space-y-4">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-slate-200 mb-2">
              Email Address *
            </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              placeholder="your@email.com"
              :disabled="loading"
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          <!-- Username Field -->
          <div>
            <label for="username" class="block text-sm font-medium text-slate-200 mb-2">
              Username *
            </label>
            <input
              id="username"
              v-model="formData.username"
              type="text"
              required
              placeholder="username"
              :disabled="loading"
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
            />
            <p class="text-xs text-slate-300 mt-1">3-30 characters, letters, numbers, _ and - only</p>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-slate-200 mb-2">
              Password *
            </label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              placeholder="••••••••"
              :disabled="loading"
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
            />
            <p class="text-xs text-slate-300 mt-1">Minimum 6 characters</p>
          </div>

          <!-- Full Name Field (Optional) -->
          <div>
            <label for="fullName" class="block text-sm font-medium text-slate-200 mb-2">
              Full Name (Optional)
            </label>
            <input
              id="fullName"
              v-model="formData.fullName"
              type="text"
              placeholder="John Doe"
              :disabled="loading"
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <p class="text-red-200 text-sm flex items-center">
              <span class="mr-2">⚠️</span>
              {{ error }}
            </p>
          </div>

          <!-- Success Message -->
          <div v-if="success" class="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
            <p class="text-green-200 text-sm flex items-center">
              <span class="mr-2">✅</span>
              {{ success }}
            </p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <span v-if="loading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Account...
            </span>
            <span v-else>Create Account</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-white/20"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-4 bg-transparent text-slate-300">Already have an account?</span>
          </div>
        </div>

        <!-- Sign In Link -->
        <NuxtLink
          to="/auth/signin"
          class="block w-full text-center bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 border border-white/20"
        >
          Sign In Instead
        </NuxtLink>
      </div>

      <!-- Footer Links -->
      <div class="text-center mt-6 space-x-4">
        <NuxtLink to="/terms-and-policy" class="text-slate-300 hover:text-white text-sm transition-colors">
          Terms
        </NuxtLink>
        <span class="text-slate-500">•</span>
        <NuxtLink to="/terms-and-policy" class="text-slate-300 hover:text-white text-sm transition-colors">
          Privacy
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// No auth required - public page
definePageMeta({
  layout: 'blank',
  middleware: []
})

const { signup } = useAuth()

// Form data
const formData = ref({
  email: '',
  username: '',
  password: '',
  fullName: '',
})

const loading = ref(false)
const error = ref('')
const success = ref('')

/**
 * Handle signup form submission
 */
const handleSignup = async () => {
  // Reset messages
  error.value = ''
  success.value = ''

  // Validate form
  if (!formData.value.email || !formData.value.username || !formData.value.password) {
    error.value = 'Please fill in all required fields'
    return
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.value.email)) {
    error.value = 'Please enter a valid email address'
    return
  }

  // Validate username format
  if (!/^[a-z0-9_-]+$/i.test(formData.value.username)) {
    error.value = 'Username can only contain letters, numbers, underscores, and hyphens'
    return
  }

  if (formData.value.username.length < 3 || formData.value.username.length > 30) {
    error.value = 'Username must be between 3 and 30 characters'
    return
  }

  // Validate password length
  if (formData.value.password.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }

  loading.value = true

  try {
    console.log('[Signup Page] Submitting signup form...')

    const result = await signup({
      email: formData.value.email,
      username: formData.value.username,
      password: formData.value.password,
      fullName: formData.value.fullName,
    })

    if (result.success) {
      console.log('[Signup Page] ✅ Signup successful')
      
      if (result.needsConfirmation) {
        // Email confirmation required
        success.value = result.message || 'Account created! Please check your email to verify your account.'
        
        // Redirect to verification page after 3 seconds
        setTimeout(() => {
          navigateTo('/auth/verify-email')
        }, 3000)
      } else {
        // No confirmation needed - redirect to feed
        success.value = 'Account created successfully! Redirecting...'
        
        setTimeout(() => {
          navigateTo('/feed')
        }, 1500)
      }
    } else {
      console.error('[Signup Page] ✗ Signup failed:', result.error)
      error.value = result.error || 'Signup failed. Please try again.'
    }

  } catch (err: any) {
    console.error('[Signup Page] Unexpected error:', err)
    error.value = err.message || 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Custom scrollbar for the page */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
