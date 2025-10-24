<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-xl p-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
        <p class="text-gray-600 mb-8">Sign in to your SocialVerse account</p>

        <form @submit.prevent="handleLogin" class="space-y-4">
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

          <div v-if="error" class="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="mt-6 space-y-3">
          <NuxtLink to="/auth/forgot-password" class="block text-center text-sm text-blue-600 hover:text-blue-700">
            Forgot your password?
          </NuxtLink>
          <p class="text-center text-gray-600">
            Don't have an account?
            <NuxtLink to="/auth/signup" class="text-blue-600 hover:text-blue-700 font-semibold">
              Sign up
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    // Get Supabase client
    let supabase = null
    try {
      supabase = useSupabaseClient()
    } catch (err) {
      error.value = 'Authentication service not available'
      loading.value = false
      return
    }

    // Sign in with Supabase
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (signInError) {
      error.value = signInError.message || 'Failed to sign in'
      loading.value = false
      return
    }

    if (data.user) {
      // Store user data
      localStorage.setItem('auth_token', data.session?.access_token || '')
      localStorage.setItem('user', JSON.stringify(data.user))

      // Update auth store
      const authStore = useAuthStore()
      authStore.user = data.user
      authStore.sessionValid = true

      // Redirect to feed or homepage
      await navigateTo('/feed')
    }
  } catch (err: any) {
    console.error('Login error:', err)
    error.value = err.message || 'An error occurred during sign in'
  } finally {
    loading.value = false
  }
}

definePageMeta({
  layout: 'default'
})
</script>

<style scoped>
/* Styles are handled by Tailwind CSS classes */
</style>
