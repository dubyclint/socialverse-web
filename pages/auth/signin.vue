<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-block">
          <h1 class="text-4xl font-bold text-white mb-2">🌐 SocialVerse</h1>
        </NuxtLink>
        <p class="text-slate-300">Welcome back to the community</p>
      </div>

      <!-- Signin Form Card -->
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
        <h2 class="text-2xl font-bold text-white mb-6 text-center">Sign In</h2>

        <form @submit.prevent="handleSignin" class="space-y-4">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-slate-200 mb-2">
              Email Address
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

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-slate-200 mb-2">
              Password
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
          </div>

          <!-- Forgot Password Link -->
          <div class="text-right">
            <NuxtLink
              to="/auth/forgot-password"
              class="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Forgot password?
            </NuxtLink>
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
            class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <span v-if="loading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing In...
            </span>
            <span v-else>Sign In</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-white/20"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-4 bg-transparent text-slate-300">Don't have an account?</span>
          </div>
        </div>

        <!-- Sign Up Link -->
        <NuxtLink
          to="/auth/signup"
          class="block w-full text-center bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 border border-white/20"
        >
          Create Account
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
import { useAuthWithErrorCatcher } from '~/composables/use-auth-
const

// No auth required - public page
definePageMeta({
  layout: 'blank',
  middleware: 'guest'
})

const { login } = useAuth()

// Form data
const formData = ref({
  email: '',
  password: '',
})

const loading = ref(false)
const error = ref('')
const success = ref('')

/**
 * Handle signin form submission
 */
const handleSignin = async () => {
  // Reset messages
  error.value = ''
  success.value = ''

  console.log('[Signin Page] Submitting signin form...')

  // Validate form
  if (!formData.value.email || !formData.value.password) {
    error.value = 'Please fill in all fields'
    console.error('[Signin Page] Missing required fields')
    return
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.value.email)) {
    error.value = 'Please enter a valid email address'
    console.error('[Signin Page] Invalid email format')
    return
  }

  loading.value = true

  try {
    console.log('[Signin Page] Calling login function with:', {
      email: formData.value.email,
      password: '***'
    })

    // Call login with object parameter (not separate parameters)
const result = await login(
  formData.value.email,
  formData.value.password
)

    console.log('[Signin Page] Login result:', result)

    if (result.success) {
      console.log('[Signin Page] ✅ Signin successful')
      success.value = 'Signed in successfully! Redirecting...'
      
      // Redirect to feed after 1 second
      setTimeout(() => {
        navigateTo('/feed')
      }, 1000)
    } else {
      console.error('[Signin Page] ✗ Signin failed:', result.error)
      error.value = result.error || 'Invalid email or password'
    }

  } catch (err: any) {
    console.error('[Signin Page] Unexpected error:', err)
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
