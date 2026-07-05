<template>
  <div class="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
    <div v-if="userStore.error" class="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
      <p class="text-red-400 text-sm">{{ userStore.error }}</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-slate-300 mb-2">Email</label>
        <input 
          id="email" 
          v-model="formData.email" 
          type="email" 
          required 
          :disabled="userStore.isLoading"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500" 
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-slate-300 mb-2">Password</label>
        <input 
          id="password" 
          v-model="formData.password" 
          type="password" 
          required 
          :disabled="userStore.isLoading"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500" 
        />
      </div>

      <div class="flex items-center">
        <input 
          id="rememberMe" 
          v-model="formData.rememberMe" 
          type="checkbox" 
          :disabled="userStore.isLoading"
          class="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
        />
        <label for="rememberMe" class="ml-2 text-sm text-slate-400">Remember me</label>
      </div>

      <button 
        type="submit" 
        :disabled="userStore.isLoading"
        class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
      >
        {{ userStore.isLoading ? 'Signing in...' : 'Sign In' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
// Updated import
import { useUserStore } from '~/stores/user'

const emit = defineEmits<{ success: [data: any] }>()
// Updated store instance
const userStore = useUserStore()

const formData = reactive({
  email: '',
  password: '',
  rememberMe: false
})

onMounted(() => {
  // Sync local UI state with the store's persistent cookie
  formData.rememberMe = userStore.rememberMe
})

const handleSubmit = async () => {
  // Clear any existing errors before attempting sign in
  userStore.setError(null)
  
  // Persist rememberMe preference before login
  userStore.setRememberMe(formData.rememberMe)
  
  const result = await userStore.signIn(formData.email, formData.password)
  
  if (result.success) {
    emit('success', result)
  }
}
</script>
