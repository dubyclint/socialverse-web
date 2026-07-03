<template>
  <div class="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
    <div v-if="localValidationError || authStore.error" class="mb-4 p-4 bg-red-900/30 border border-red-500/70 rounded-lg">
      <p class="text-red-300 text-sm font-medium">{{ localValidationError || authStore.error }}</p>
    </div>

    <div v-if="success" class="mb-4 p-4 bg-green-900/30 border border-green-500/70 rounded-lg">
      <p class="text-green-300 text-sm font-medium">{{ success }}</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
        <input
          id="email"
          v-model="formData.email"
          type="email"
          required
          :disabled="authStore.isLoading"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50"
        />
        <p v-if="errors.email" class="mt-1 text-xs text-red-400">{{ errors.email }}</p>
      </div>

      <div>
        <label for="username" class="block text-sm font-medium text-slate-300 mb-2">Username</label>
        <input
          id="username"
          v-model="formData.username"
          @input="formData.username = formData.username.toLowerCase()"
          type="text"
          required
          :disabled="authStore.isLoading"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50"
        />
        <p v-if="errors.username" class="mt-1 text-xs text-red-400">{{ errors.username }}</p>
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-slate-300 mb-2">Password</label>
        <input
          id="password"
          v-model="formData.password"
          type="password"
          required
          :disabled="authStore.isLoading"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50"
        />
        <p v-if="errors.password" class="mt-1 text-xs text-red-400">{{ errors.password }}</p>
      </div>

      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
        <input
          id="confirmPassword"
          v-model="formData.confirmPassword"
          type="password"
          required
          :disabled="authStore.isLoading"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50"
        />
        <p v-if="errors.confirmPassword" class="mt-1 text-xs text-red-400">{{ errors.confirmPassword }}</p>
      </div>

      <button
        type="submit"
        :disabled="authStore.isLoading || !formData.agreeToTerms"
        class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded-lg"
      >
        {{ authStore.isLoading ? 'Creating account...' : 'Create Account' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '~/stores/auth'

const emit = defineEmits<{ success: [data: any] }>()
const authStore = useAuthStore()

const success = ref('')
const localValidationError = ref('')

const formData = reactive({
  email: '', username: '', password: '', confirmPassword: '', agreeToTerms: false
})

const errors = reactive({ email: '', username: '', password: '', confirmPassword: '' })

const validateForm = () => {
  // ... (Keep your existing validation logic)
  return !errors.email && !errors.username && !errors.password && !errors.confirmPassword
}

const handleSubmit = async () => {
  localValidationError.value = ''
  
  if (!validateForm()) {
    localValidationError.value = 'Please fix the errors above'
    return
  }

  // Use the new store action directly
  const result = await authStore.signUp(formData.email, formData.password, {
    data: { username: formData.username }
  })

  if (result.success) {
    success.value = 'Account created successfully!'
    setTimeout(() => emit('success', { email: formData.email }), 500)
  }
}
</script>
