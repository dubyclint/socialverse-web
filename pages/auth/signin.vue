<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-xl p-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
        <p class="text-gray-600 mb-8">Welcome back to SocialVerse</p>

        <form @submit.prevent="handleSignin" class="space-y-4">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="you@example.com"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :disabled="loading"
            />
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :disabled="loading"
            />
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {{ error }}
          </div>

          <!-- Success Message -->
          <div v-if="success" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {{ success }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            {{ loading ? 'Signing In...' : 'Sign In' }}
          </button>
        </form>

        <!-- Forgot Password Link -->
        <div class="text-center mt-4">
          <NuxtLink to="/auth/forgot-password" class="text-blue-600 hover:text-blue-700 font-semibold text-sm">
            Forgot Password?
          </NuxtLink>
        </div>

        <!-- Signup Link -->
        <p class="text-center text-gray-600 mt-6">
          Don't have an account?
          <NuxtLink to="/auth/signup" class="text-blue-600 hover:text-blue-700 font-semibold">
            Sign Up
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

const handleSignin = async () => {
  error.value = ''
  success.value = ''

  // Validation
  if (!email.value || !password.value) {
    error.value = 'Email and password are required'
    return
  }

  loading.value = true

  try {
    console.log('[Signin] Sending request with:', {
      email: email.value
    })

    // ✅ STEP 1: Call signin endpoint
    const response = await $fetch('/api/auth/signin', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })

    console.log('[Signin] Response received:', response)

    if (response.success) {
      success.value = response.statusMessage || 'Signed in successfully!'
      
      // ✅ STEP 2: Get auth store
      const authStore = useAuthStore()
      
      // ✅ STEP 3: Perform handshake (fetch profile, load permissions, init plugins)
      console.log('[Signin] Performing auth handshake...')
      const handshakeResult = await authStore.performSignupHandshake()
      
      if (handshakeResult.success) {
        console.log('[Signin] ✅ Handshake complete, redirecting to dashboard...')
        // Redirect to dashboard after handshake
        setTimeout(() => {
          router.push('/feed')
        }, 1000)
      } else {
        console.error('[Signin] Handshake failed:', handshakeResult.error)
        error.value = 'Failed to initialize session. Please try again.'
      }
    } else {
      error.value = response.statusMessage || 'Sign in failed. Please try again.'
    }
  } catch (err) {
    console.error('[Signin] Error caught:', err)
    
    // ✅ Handle both statusMessage and message fields
    const errorMessage = 
      err.data?.statusMessage || 
      err.statusMessage || 
      err.data?.message || 
      err.message || 
      'Sign in failed. Please try again.'
    
    error.value = errorMessage
    console.error('[Signin] Error message displayed:', error.value)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Add any additional styles here */
</style>
