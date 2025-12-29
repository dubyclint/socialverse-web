 FIXED FILE 1: /components/auth/signin-form.vue
# ============================================================================
# SIGNIN FORM - FIXED: Removed direct localStorage usage
# ============================================================================
# ✅ FIXED: Removed localStorage.setItem('rememberMe', 'true')
# ✅ FIXED: Using auth store for remember me preference
# ✅ FIXED: Proper error handling
# ============================================================================

<template>
  <div class="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
    <!-- Error Message -->
    <div v-if="error" class="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
      <p class="text-red-400 text-sm">{{ error }}</p>
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
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
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
          placeholder="Enter your password"
          :disabled="loading"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      <!-- Remember Me -->
      <div class="flex items-center">
        <input
          id="rememberMe"
          v-model="formData.rememberMe"
          type="checkbox"
          :disabled="loading"
          class="rounded border-slate-600 text-blue-500 focus:ring-blue-500"
        />
        <label for="rememberMe" class="ml-2 text-sm text-slate-400">
          Remember me
        </label>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="loading"
        class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
      >
        <span v-if="loading" class="flex items-center justify-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Signing in...
        </span>
        <span v-else>Sign In</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const emit = defineEmits<{
  success: [data: any]
}>()

const { login } = useAuth()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref('')

const formData = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const handleSubmit = async () => {
  error.value = ''
  loading.value = true

  try {
    console.log('[SignInForm] Submitting signin form')
    
    const result = await login(formData.email, formData.password)

    if (result.success) {
      console.log('[SignInForm] ✅ Login successful')
      
      // ✅ FIXED: Store remember me preference in auth store instead of localStorage
      if (formData.rememberMe) {
        console.log('[SignInForm] Setting remember me preference in auth store')
        authStore.setRememberMe(true)
      } else {
        authStore.setRememberMe(false)
      }
      
      emit('success', result)
    } else {
      error.value = result.error || 'Login failed'
      console.error('[SignInForm] ✗ Login failed:', error.value)
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred during login'
    console.error('[SignInForm] ✗ Exception:', error.value)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Minimal scoped styles */
</style>
