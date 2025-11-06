<template>
  <div class="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
    <!-- Error Message - Enhanced visibility -->
    <div v-if="error" class="mb-4 p-4 bg-red-900/30 border border-red-500/70 rounded-lg animate-pulse">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <p class="text-red-300 text-sm font-medium">{{ error }}</p>
      </div>
    </div>

    <!-- Success Message - Enhanced visibility -->
    <div v-if="success" class="mb-4 p-4 bg-green-900/30 border border-green-500/70 rounded-lg animate-pulse">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <p class="text-green-300 text-sm font-medium">{{ success }}</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Email Field -->
      <div>
        <label for="email" class="block text-sm font-medium text-slate-300 mb-2">
          Email Address
        </label>
        <input
          id="email"
          v-model="formData.email"
          type="email"
          required
          placeholder="your@email.com"
          :disabled="loading"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        />
        <p v-if="errors.email" class="mt-1 text-xs text-red-400">{{ errors.email }}</p>
      </div>

      <!-- Username Field -->
      <div>
        <label for="username" class="block text-sm font-medium text-slate-300 mb-2">
          Username
        </label>
        <input
          id="username"
          v-model="formData.username"
          type="text"
          required
          placeholder="username"
          :disabled="loading"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        />
        <p class="mt-1 text-xs text-slate-400">
          3-20 characters, letters, numbers, underscores, hyphens only
        </p>
        <p v-if="errors.username" class="mt-1 text-xs text-red-400">{{ errors.username }}</p>
      </div>

      <!-- Password Field -->
      <div>
        <label for="password" class="block text-sm font-medium text-slate-300 mb-2">
          Password
        </label>
        <input
          id="password"
          v-model="formData.password"
          type="password"
          required
          placeholder="Create a strong password"
          :disabled="loading"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        />
        <p class="mt-1 text-xs text-slate-400">
          Min 8 chars, 1 uppercase, 1 number, 1 special character (@$!%*?&)
        </p>
        <p v-if="errors.password" class="mt-1 text-xs text-red-400">{{ errors.password }}</p>
      </div>

      <!-- Confirm Password Field -->
      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-slate-300 mb-2">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          v-model="formData.confirmPassword"
          type="password"
          required
          placeholder="Confirm your password"
          :disabled="loading"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        />
        <p v-if="errors.confirmPassword" class="mt-1 text-xs text-red-400">
          {{ errors.confirmPassword }}
        </p>
      </div>

      <!-- Terms & Conditions -->
      <div class="flex items-start">
        <input
          id="terms"
          v-model="formData.agreeToTerms"
          type="checkbox"
          required
          :disabled="loading"
          class="mt-1 rounded border-slate-600 text-blue-500 focus:ring-blue-500 cursor-pointer"
        />
        <label for="terms" class="ml-2 text-sm text-slate-400">
          I agree to the
          <NuxtLink to="/terms" class="text-blue-500 hover:text-blue-400 font-medium">
            Terms of Service
          </NuxtLink>
          and
          <NuxtLink to="/privacy" class="text-blue-500 hover:text-blue-400 font-medium">
            Privacy Policy
          </NuxtLink>
        </label>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="loading || !formData.agreeToTerms"
        class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors duration-200"
      >
        <span v-if="loading" class="flex items-center justify-center gap-2">
          <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Creating account...</span>
        </span>
        <span v-else>Create Account</span>
      </button>
    </form>

    <!-- Additional Help Text -->
    <p class="mt-6 text-center text-sm text-slate-400">
      Already have an account?
      <NuxtLink to="/auth/signin" class="text-blue-500 hover:text-blue-400 font-medium">
        Sign in here
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const emit = defineEmits<{
  success: [data: any]
}>()

const { signup } = useAuth()

const loading = ref(false)
const error = ref('')
const success = ref('')

const formData = reactive({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false
})

const errors = reactive({
  email: '',
  username: '',
  password: '',
  confirmPassword: ''
})

/**
 * Validate form inputs before submission
 * Checks email format, username format, password strength, and password match
 */
const validateForm = () => {
  // Reset all errors
  errors.email = ''
  errors.username = ''
  errors.password = ''
  errors.confirmPassword = ''

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.email)) {
    errors.email = 'Please enter a valid email address'
  }

  // Username validation - must be 3-20 characters
  if (formData.username.length < 3 || formData.username.length > 20) {
    errors.username = 'Username must be 3-20 characters'
  }
  // Username format - only alphanumeric, underscore, hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
    errors.username = 'Username can only contain letters, numbers, underscores, and hyphens'
  }

  // Password validation - must have uppercase, number, special char, and be 8+ chars
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  if (!passwordRegex.test(formData.password)) {
    errors.password = 'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character'
  }

  // Confirm password match
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  // Return true if no errors
  return !errors.email && !errors.username && !errors.password && !errors.confirmPassword
}

/**
 * Handle form submission
 * Validates form, calls signup API, and handles response
 */
const handleSubmit = async () => {
  // Clear previous messages
  error.value = ''
  success.value = ''

  // Validate form before submission
  if (!validateForm()) {
    error.value = 'Please fix the errors above'
    return
  }

  loading.value = true

  try {
    console.log('[SignUpForm] Submitting signup form...')
    
    // Call the signup composable
    const result = await signup(
      formData.email,
      formData.password,
      formData.username
    )

    console.log('[SignUpForm] Signup result:', result)

    if (result.success) {
      // Success - show message and emit event
      success.value = result.message || 'Account created successfully!'
      console.log('[SignUpForm] Signup successful, emitting success event')
      
      // Emit success event after a short delay to show the success message
      setTimeout(() => {
        emit('success', { email: formData.email })
      }, 1500)
    } else {
      // Failure - show error message from backend
      // PROBLEM #1 FIX: Use result.message which now contains specific error from backend
      error.value = result.message || 'Signup failed. Please try again.'
      console.error('[SignUpForm] Signup failed:', error.value)
    }
  } catch (err: any) {
    // Catch unexpected errors
    console.error('[SignUpForm] Unexpected error during signup:', err)
    error.value = err.message || 'An unexpected error occurred. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
