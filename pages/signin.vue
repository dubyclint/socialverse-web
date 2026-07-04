<template>
  <div v-if="localError || userStore.error" class="...">
    <p>{{ localError || userStore.error }}</p>
  </div>

  <form @submit.prevent="handleSignin" class="space-y-4">
    <button
      type="submit"
      :disabled="userStore.isLoading"
      class="..."
    >
      {{ userStore.isLoading ? 'Logging in...' : 'Log In' }}
    </button>
  </form>
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
    console.error('[Signin Page] Authentication failed:', result.message)
  }
}
</script>
