<template>
  <div class="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
    <!-- Error Message -->
    <div v-if="error" class="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
      <p class="text-red-400 text-sm">{{ error }}</p>
    </div>

    <!-- Success Message -->
    <div v-if="success" class="mb-4 p-4 bg-green-900/20 border border-green-500/50 rounded-lg">
      <p class="text-green-400 text-sm">{{ success }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="verifying" class="text-center py-8">
      <svg class="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="text-slate-300">Verifying your email...</p>
    </div>

    <!-- Manual Token Entry -->
    <div v-else class="space-y-4">
      <p class="text-slate-400 text-sm">
        We've sent a verification link to your email. Click the link in the email or enter the code below.
      </p>

      <form @submit.prevent="handleManualVerification" class="space-y-4">
        <div>
          <label for="token" class="block text-sm font-medium text-slate-300 mb-2">
            Verification Code
          </label>
          <input
            id="token"
            v-model="token"
            type="text"
            placeholder="Enter verification code"
            :disabled="loading"
            class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          :disabled="loading || !token"
          class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
        >
          <span v-if="loading" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verifying...
          </span>
          <span v-else>Verify Email</span>
        </button>
      </form>

      <!-- Resend Email -->
      <div class="text-center pt-4 border-t border-slate-700">
        <p class="text-slate-400 text-sm mb-2">Didn't receive the email?</p>
        <button
          @click="handleResendEmail"
          :disabled="loading || resendCooldown > 0"
          class="text-blue-500 hover:text-blue-400 text-sm font-semibold disabled:text-slate-500"
        >
          <span v-if="resendCooldown > 0">
            Resend in {{ resendCooldown }}s
          </span>
          <span v-else>
            Resend verification email
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emit = defineEmits<{
  success: []
}>()

const route = useRoute()
const { verifyEmail, resendVerification } = useAuth()

const token = ref('')
const loading = ref(false)
const verifying = ref(true)
const error = ref('')
const success = ref('')
const resendCooldown = ref(0)

const handleManualVerification = async () => {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    const result = await verifyEmail(token.value)

    if (result.success) {
      success.value = 'Email verified successfully!'
      setTimeout(() => {
        emit('success')
      }, 1500)
    } else {
      error.value = result.error || 'Verification failed'
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred'
  } finally {
    loading.value = false
  }
}

const handleResendEmail = async () => {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    const email = route.query.email as string
    if (!email) {
      error.value = 'Email not found'
      return
    }

    const result = await resendVerification(email)

    if (result.success) {
      success.value = 'Verification email sent!'
      resendCooldown.value = 60
      const interval = setInterval(() => {
        resendCooldown.value--
        if (resendCooldown.value <= 0) {
          clearInterval(interval)
        }
      }, 1000)
    } else {
      error.value = result.error || 'Failed to resend email'
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Check if token is in URL query
  const tokenFromUrl = route.query.token as string
  if (tokenFromUrl) {
    token.value = tokenFromUrl
    // Auto-verify
    handleManualVerification()
  } else {
    verifying.value = false
  }
})
</script>

<style scoped>
/* Minimal scoped styles */
</style>
