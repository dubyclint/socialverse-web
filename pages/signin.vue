<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
        <p class="text-gray-600">Log in to your account</p>
      </div>

      <div v-if="localError || authError" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-700 text-sm">{{ localError || authError }}</p>
      </div>

      <form @submit.prevent="handleSignin" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            required
            :disabled="isAuthLoading || submitting"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:text-gray-400"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            required
            :disabled="isAuthLoading || submitting"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:text-gray-400"
          />
        </div>

        <button
          type="submit"
          :disabled="isAuthLoading || submitting"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          {{ (isAuthLoading || submitting) ? 'Logging in...' : 'Log In' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-gray-600 text-sm">
          Don't have an account yet?
          <NuxtLink to="/signup" class="text-blue-600 hover:text-blue-700 font-semibold">Sign up</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '~/composables/use-auth'
import { useAuthStore } from '~/stores/auth'
import { useProfileStore } from '~/stores/profile'

definePageMeta({
  layout: 'blank',
  middleware: 'guest'
})

const { signIn, loading: isAuthLoading, error: authError } = useAuth()
const authStore = useAuthStore()
const profileStore = useProfileStore()

const email = ref('')
const password = ref('')
const localError = ref('')
const submitting = ref(false)

onMounted(async () => {
  // Ensure auth is hydrated before deciding where to go
  if (!authStore.isHydrated) {
    await authStore.hydrateFromStorage()
  }

  // If already authenticated, skip signin page cleanly
  if (authStore.isAuthenticated) {
    await navigateTo('/feed', { replace: true })
  }
})

const handleSignin = async () => {
  if (submitting.value) return
  submitting.value = true
  localError.value = ''

  const cleanEmail = email.value.trim()
  const rawPassword = password.value

  if (!cleanEmail || !rawPassword) {
    localError.value = 'Email and password are required'
    submitting.value = false
    return
  }

  try {
    console.log('[Signin Page] Executing credentials sign-in...')

    // Prevent stale profile bleed between users
    profileStore.clearProfile()
    profileStore.clearAllProfileCache?.()

    // Perform sign in (your composable should set authStore token/user)
    const result = await signIn(cleanEmail, rawPassword)

    if (!result?.success) {
      localError.value = result?.message || 'Invalid credentials'
      submitting.value = false
      return
    }

    // Ensure auth store has settled after signIn
    await new Promise((r) => setTimeout(r, 50))

    if (!authStore.token || !authStore.userId) {
      localError.value = 'Login succeeded but session could not be established. Please try again.'
      submitting.value = false
      return
    }

    // Prime correct profile for this authenticated user
    await profileStore.fetchProfile()

    console.log('[Signin Page] ✅ Authentication passed cleanly.')
    await navigateTo('/feed', { replace: true })
  } catch (err: any) {
    console.error('[Signin Page] Runtime error during authentication:', err)
    localError.value = err?.data?.message || err?.message || 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>
