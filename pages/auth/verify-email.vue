<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-xl p-8 text-center">
        <div class="mb-6">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <h1 class="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
        <p class="text-gray-600 mb-8">We've sent a verification link to {{ userEmail }}</p>

        <div v-if="error" class="p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
          {{ error }}
        </div>

        <div v-if="success" class="p-3 bg-green-100 border border-green-400 text-green-700 rounded mb-4">
          {{ success }}
        </div>

        <button
          @click="resendEmail"
          :disabled="loading || resendCooldown > 0"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          {{ loading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email' }}
        </button>

        <p class="text-center text-gray-600 mt-6">
          <NuxtLink to="/auth/login" class="text-blue-600 hover:text-blue-700 font-semibold">
            Back to login
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const userEmail = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
const resendCooldown = ref(0)

onMounted(() => {
  const user = localStorage.getItem('user')
  if (user) {
    userEmail.value = JSON.parse(user).email
  }
})

const resendEmail = async () => {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    await $fetch('/api/auth/resend-verification', {
      method: 'POST',
      body: { email: userEmail.value }
    })

    success.value = 'Verification email sent!'
    resendCooldown.value = 60

    const interval = setInterval(() => {
      resendCooldown.value--
      if (resendCooldown.value <= 0) clearInterval(interval)
    }, 1000)
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to resend email'
  } finally {
    loading.value = false
  }
}
</script>
