<template>
  <div class="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
    <div v-if="authStore.error" class="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
      <p class="text-red-400 text-sm">{{ authStore.error }}</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-slate-300 mb-2">Email</label>
        <input id="email" v-model="formData.email" type="email" required :disabled="authStore.isLoading"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500" />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-slate-300 mb-2">Password</label>
        <input id="password" v-model="formData.password" type="password" required :disabled="authStore.isLoading"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500" />
      </div>

      <div class="flex items-center">
        <input id="rememberMe" v-model="formData.rememberMe" type="checkbox" :disabled="authStore.isLoading" />
        <label for="rememberMe" class="ml-2 text-sm text-slate-400">Remember me</label>
      </div>

      <button type="submit" :disabled="authStore.isLoading"
        class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded-lg">
        <span v-if="authStore.isLoading">Signing in...</span>
        <span v-else>Sign In</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useAuthStore } from '~/stores/auth'

const emit = defineEmits<{ success: [data: any] }>()
const authStore = useAuthStore()

const formData = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const handleSubmit = async () => {
  const result = await authStore.signIn(formData.email, formData.password)
  
  if (result.success) {
    authStore.setRememberMe(formData.rememberMe)
    emit('success', result)
  }
}
</script>
