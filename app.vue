<!-- app.vue -->
<template>
  <NuxtLayout>
    <div id="app">
      <NuxtPage />
      
      <!-- Global Notifications -->
      <NotificationToast />
      
      <!-- Global Loading -->
      <GlobalLoading v-if="isLoading" />
      
      <!-- Global Error -->
      <ErrorBoundary v-if="globalError" class="global-error">
        <p>{{ globalError }}</p>
        <button @click="clearError">Dismiss</button>
      </ErrorBoundary>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '~/stores/user'

// Stores
const userStore = useUserStore()

// Reactive data
const isLoading = ref(false)
const globalError = ref<string | null>(null)

// Lifecycle
onMounted(async () => {
  try {
    console.log('[App] Initializing application...')
    isLoading.value = true
    
    // Initialize user session if user is authenticated
    if (userStore.isAuthenticated) {
      console.log('[App] Initializing session for user')
      try {
        await userStore.initializeSession()
      } catch (err) {
        console.warn('[App] Session initialization failed:', err)
      }
    }
  } catch (error) {
    console.error('[App] Initialization error:', error)
    globalError.value = 'Failed to initialize application'
  } finally {
    isLoading.value = false
  }
})

const clearError = () => {
  globalError.value = null
}
</script>

<style scoped>
#app {
  width: 100%;
  min-height: 100vh;
}

.global-error {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  padding: 16px;
  z-index: 9999;
}

.global-error button {
  margin-top: 8px;
  padding: 4px 12px;
  background: #f44;
  color: white;
  border: none;
  border-radius: 2px;
  cursor: pointer;
}
</style>
