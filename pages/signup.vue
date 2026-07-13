<template>
  <div class="min-h-screen bg-slate-950 flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-black text-white mb-2">Create Account</h1>
        <p class="text-slate-400 text-sm">Join our community today</p>
      </div>

      <!-- Alerts -->
      <div v-if="localError || authError" class="mb-6 p-3 bg-rose-900/20 border border-rose-900/50 rounded-xl">
        <p class="text-rose-400 text-xs font-medium">{{ localError || authError }}</p>
      </div>

      <div v-if="success" class="mb-6 p-3 bg-emerald-900/20 border border-emerald-900/50 rounded-xl">
        <p class="text-emerald-400 text-xs font-medium">{{ success }}</p>
      </div>

      <form @submit.prevent="handleSignup" class="space-y-4">
        <div>
          <label class="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Email</label>
          <input v-model="formData.email" type="email" required :disabled="isAuthLoading"
            class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
        </div>

        <div>
          <label class="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Username</label>
          <input v-model="formData.username" type="text" required :disabled="isAuthLoading"
            class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
        </div>

        <div>
          <label class="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Phone Number</label>
          <input v-model="formData.phone" type="tel" required :disabled="isAuthLoading"
            class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
        </div>

        <div>
          <label class="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Location</label>
          <input v-model="formData.location" type="text" required :disabled="isAuthLoading"
            class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
        </div>

        <div>
          <label class="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Password</label>
          <input v-model="formData.password" type="password" required minlength="6" :disabled="isAuthLoading"
            class="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
        </div>

        <button type="submit" :disabled="isAuthLoading"
          class="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs py-3.5 rounded-xl transition-all">
          {{ isAuthLoading ? 'Creating Account...' : 'Sign Up' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-slate-500 text-xs">
          Already have an account? 
          <NuxtLink to="/signin" class="text-indigo-400 hover:text-indigo-300 font-bold">Log in</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { navigateTo } from '#app'
import { storeToRefs } from 'pinia'
import { useUserStore } from '~/stores/user'
import { api } from '~/lib/api'
import type { AuthUser } from '~/types/user'

definePageMeta({ layout: 'blank', middleware: 'guest' })

const userStore = useUserStore()
const { isLoading: isAuthLoading, error: authError } = storeToRefs(userStore)

const formData = ref({ email: '', username: '', phone: '', location: '', password: '' })
const localError = ref('')
const success = ref('')

const handleSignup = async () => {
  localError.value = ''
  success.value = ''

  try {
    const response = await api<{ user: AuthUser | null }>('/auth/signup', {
      method: 'POST',
      body: {
        email: formData.value.email.trim(),
        password: formData.value.password,
        username: formData.value.username.trim().toLowerCase(),
        phone: formData.value.phone.trim(),
        location: formData.value.location.trim()
      }
    })

    if (response.user) {
      userStore.setUser(response.user)
      success.value = 'Account created successfully! Redirecting...'
      setTimeout(() => navigateTo('/profile/complete'), 1200)
    }
  } catch (err: any) {
    localError.value = err?.data?.message || 'Registration failed'
  }
}
</script>

<style scoped>
/* Ensure smooth transitions for all interactive elements */
input, button {
  transition: all 0.2s ease-in-out;
}

/* Custom styling for the form container to match your other cards */
.auth-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

/* Enhancing the focus state for accessibility */
input:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

/* Styling for the error/success boxes */
.alert-box {
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

/* Subtle animation for the signup button when loading */
button:disabled {
  cursor: not-allowed;
  filter: grayscale(0.4);
}

/* Mobile-responsive padding adjustment */
@media (max-width: 640px) {
  .auth-card {
    padding: 1.5rem;
  }
}
</style>
