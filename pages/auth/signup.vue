<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-xl p-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
        <p class="text-gray-600 mb-8">Join SocialVerse today</p>

        <form @submit.prevent="handleSignup" class="space-y-4">
          <!-- Full Name Field -->
          <div>
            <label for="fullName" class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              id="fullName"
              v-model="fullName"
              type="text"
              required
              placeholder="John Doe"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :disabled="loading"
            />
          </div>

          <!-- Username Field -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              placeholder="johndoe"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :disabled="loading"
            />
          </div>

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

          <!-- Phone Number Field -->
          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              id="phone"
              v-model="phone"
              type="tel"
              required
              placeholder="+1 (555) 000-0000"
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

          <!-- Confirm Password Field -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
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
            {{ loading ? 'Creating Account...' : 'Create Account' }}
          </button>
        </form>

        <!-- Login Link -->
        <p class="text-center text-gray-600 mt-6">
          Already have an account?
          <NuxtLink to="/auth/login" class="text-blue-600 hover:text-blue-700 font-semibold">
            Sign In
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const fullName = ref('')
const username = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

const handleSignup = async () => {
  error.value = ''
  success.value = ''

  // Validation
  if (!fullName.value || !username.value || !email.value || !phone.value || !password.value) {
    error.value = 'All fields are required'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters'
    return
  }

  loading.value = true

  try {
    console.log('[Signup] Sending request with:', {
      email: email.value,
      username: username.value,
      fullName: fullName.value,
      phone: phone.value
    })

    const response = await $fetch('/api/auth/signup', {
      method: 'POST',
      body: {
        fullName: fullName.value,
        username: username.value,
        email: email.value,
        phone: phone.value,
        password: password.value
      }
    })

    console.log('[Signup] Response received:', response)

    if (response.success) {
      success.value = response.statusMessage || 'Account created successfully! Redirecting to login...'
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } else {
      error.value = response.statusMessage || 'Signup failed. Please try again.'
    }
  } catch (err) {
    console.error('[Signup] Error caught:', err)
    
    // ✅ CRITICAL FIX: Handle both statusMessage and message fields
    const errorMessage = 
      err.data?.statusMessage || 
      err.statusMessage || 
      err.data?.message || 
      err.message || 
      'Signup failed. Please try again.'
    
    error.value = errorMessage
    console.error('[Signup] Error message displayed:', error.value)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Add any additional styles here */
</style>
