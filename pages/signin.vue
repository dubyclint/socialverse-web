<template>
  <div class="min-h-screen bg-slate-950 flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-black text-white mb-2">Welcome Back</h1>
        <p class="text-slate-400 text-sm">Log in to continue</p>
      </div>

      <div v-if="localError || userStore.error" class="mb-6 p-3 bg-rose-900/20 border border-rose-900/50 rounded-xl">
        <p class="text-rose-400 text-xs font-medium">{{ localError || userStore.error }}</p>
      </div>

      <form @submit.prevent="handleSignin" class="space-y-4">
        <div>
          <label class="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Email</label>
          <input v-model="email" type="email" required :disabled="userStore.isLoading"
            class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
        </div>

        <div>
          <label class="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Password</label>
          <input v-model="password" type="password" required :disabled="userStore.isLoading"
            class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
        </div>

        <button type="submit" :disabled="userStore.isLoading"
          class="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs py-3.5 rounded-xl transition-all">
          {{ userStore.isLoading ? 'Logging in...' : 'Log In' }}
        </button>
      </form>

      <div class="mt-6 text-center space-y-2">
        <NuxtLink to="/auth/forgot-password" class="block text-slate-500 hover:text-slate-300 text-xs">Forgot password?</NuxtLink>
        <p class="text-slate-500 text-xs">
          No account yet?
          <NuxtLink to="/signup" class="text-indigo-400 hover:text-indigo-300 font-bold">Sign up</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '~/stores/user'

definePageMeta({ layout: 'blank', middleware: 'guest' })

const userStore = useUserStore()
const email = ref('')
const password = ref('')
const localError = ref('')

onMounted(async () => {
  // If your new user store needs hydration logic, keep it here.
  // Otherwise, if initializeSession handles it, call that instead.
  if (userStore.isAuthenticated) await navigateTo('/feed', { replace: true })
})

const handleSignin = async () => {
  localError.value = ''
  
  if (!email.value.trim() || !password.value) {
    localError.value = 'Email and password are required'
    return
  }

  // Delegate entirely to the unified userStore
  const result = await userStore.signIn(email.value.trim(), password.value)

  if (result.success) {
    await navigateTo('/feed', { replace: true })
  } else {
    localError.value = result.message || 'Invalid email or password'
  }
}
</script>
