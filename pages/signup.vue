<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
        <p class="text-gray-600">Join our community today</p>
      </div>

      <div v-if="localError || authError" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-700 text-sm">{{ localError || authError }}</p>
      </div>

      <div v-if="success" class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p class="text-green-700 text-sm">{{ success }}</p>
      </div>

      <form @submit.prevent="handleSignup" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            required
            :disabled="isAuthLoading"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:text-gray-400"
          />
        </div>

        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            autocomplete="username"
            placeholder="john_doe"
            required
            :disabled="isAuthLoading"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:text-gray-400"
          />
          <p class="text-xs text-gray-500 mt-1">3-20 characters, letters, numbers, underscore only</p>
        </div>

        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            id="phone"
            v-model="formData.phone"
            type="tel"
            autocomplete="tel"
            placeholder="+1 (555) 123-4567"
            required
            :disabled="isAuthLoading"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:text-gray-400"
          />
        </div>

        <div>
          <label for="location" class="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            id="location"
            v-model="formData.location"
            type="text"
            autocomplete="street-address"
            placeholder="City, Country"
            required
            :disabled="isAuthLoading"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:text-gray-400"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            autocomplete="new-password"
            placeholder="••••••••"
            required
            minlength="6"
            :disabled="isAuthLoading"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:text-gray-400"
          />
          <p class="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
        </div>

        <button
          type="submit"
          :disabled="isAuthLoading"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          {{ isAuthLoading ? 'Creating Account...' : 'Sign Up' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-gray-600 text-sm">
          Already have an account?
          <NuxtLink to="/signin?forceAuth=1" class="text-blue-600 hover:text-blue-700 font-semibold">Log in</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { navigateTo, useRoute } from '#app'
import { useAuth } from '~/composables/use-auth'

definePageMeta({
  layout: 'blank',
  middleware: 'guest'
})

const route = useRoute()
const { signUp, loading: isAuthLoading, error: authError } = useAuth()

const formData = ref({
  email: '',
  username: '',
  phone: '',
  location: '',
  password: ''
})

const localError = ref('')
const success = ref('')

const normalizePath = (value: unknown, fallback = '/signin?forceAuth=1') => {
  const raw = String(value || '').trim()
  if (!raw) return fallback
  return raw.startsWith('/') ? raw : `/${raw}`
}

const handleSignup = async () => {
  localError.value = ''
  success.value = ''

  const email = formData.value.email?.trim() || ''
  const username = formData.value.username?.trim() || ''
  const phone = formData.value.phone?.trim() || ''
  const location = formData.value.location?.trim() || ''
  const password = formData.value.password || ''

  if (!email || !username || !phone || !location || !password) {
    localError.value = 'All fields are required'
    return
  }

  try {
    const result = await signUp(email, password, {
      data: {
        username: username.toLowerCase(),
        phone,
        location
      }
    })

    success.value = 'Account created successfully! Redirecting...'

    const redirectFromQuery = normalizePath(route.query.redirect, '')
    const defaultRedirect = result?.session ? '/feed' : '/signin?forceAuth=1'
    const redirectUrl = redirectFromQuery || defaultRedirect

    setTimeout(async () => {
      await navigateTo(redirectUrl)
    }, 1200)
  } catch (err: any) {
    console.error('[Signup Page] Signup failure:', err)
    if (!localError.value) {
      localError.value = err?.data?.statusMessage || err?.message || 'Unable to sign up'
    }
  }
}
</script>
