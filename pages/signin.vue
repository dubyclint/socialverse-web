<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
        <p class="text-gray-600">Log in to your account</p>
      </div>

      <div v-if="localError || authStore.error" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-700 text-sm">{{ localError || authStore.error }}</p>
      </div>

      <form @submit.prevent="handleSignin" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            :disabled="authStore.isLoading"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            :disabled="authStore.isLoading"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
          />
        </div>

        <button
          type="submit"
          :disabled="authStore.isLoading"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          {{ authStore.isLoading ? 'Logging in...' : 'Log In' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useProfileStore } from '~/stores/profile'

definePageMeta({ layout: 'blank', middleware: 'guest' })

const authStore = useAuthStore()
const profileStore = useProfileStore()

const email = ref('')
const password = ref('')
const localError = ref('')

onMounted(async () => {
  if (!authStore.isHydrated) await authStore.hydrateFromStorage()
  if (authStore.isAuthenticated) await navigateTo('/feed', { replace: true })
})

const handleSignin = async () => {
  localError.value = ''
  
  // 1. Logic cleanup: Handle input validation locally
  if (!email.value.trim() || !password.value) {
    localError.value = 'Email and password are required'
    return
  }

  // 2. Clear stale state using store actions
  profileStore.clearProfile()
  profileStore.clearAllProfileCache?.()

  // 3. Delegate authentication to the store
  const result = await authStore.signIn(email.value.trim(), password.value)

  if (result.success) {
    // 4. Prime the profile
    await profileStore.fetchProfile()
    await navigateTo('/feed', { replace: true })
  } else {
    // Error is handled automatically by authStore.error via the signIn action
    console.error('[Signin Page] Authentication failed:', result.message)
  }
}
</script>
