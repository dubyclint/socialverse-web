<!-- app.vue - UPDATED VERSION -->
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
import { ref, onMounted, watch } from 'vue'
import { useUserStore } from '~/stores/user'
import { useSocket } from '~/composables/useSocket'

// Stores
const userStore = useUserStore()

// Composables
const { initializeSocket } = useSocket()
const user = useSupabaseUser()

// Reactive data
const isLoading = ref(false)
const globalError = ref<string | null>(null)

// Lifecycle
onMounted(async () => {
  try {
    console.log('[App] Initializing application...')
    isLoading.value = true
    
    // Initialize user session if user is authenticated
    if (user.value?.id) {
      console.log('[App] Initializing session for user:', user.value.id)
      await userStore.initializeSession()
    }
    
    // Initialize socket connection if authenticated (optional)
    if (userStore.isAuthenticated) {
      try {
        initializeSocket()
      } catch (err) {
        console.warn('[App] Socket initialization failed (non-critical):', err)
        // Don't break the app if socket fails
      }
    }
  } catch (err: any) {
    console.error('[App] Initialization error:', err)
    globalError.value = err.message || 'Failed to initialize application'
  } finally {
    isLoading.value = false
  }
})

// Watch for authentication changes
watch(
  () => user.value?.id,
  async (newUserId) => {
    if (newUserId) {
      console.log('[App] User authenticated, initializing...')
      try {
        await userStore.initializeSession()
        initializeSocket()
      } catch (err) {
        console.warn('[App] Initialization error (non-critical):', err)
      }
    } else {
      console.log('[App] User logged out')
      userStore.clearProfile()
    }
  }
)

// Clear error
const clearError = () => {
  globalError.value = null
}
</script>

<style>
#app {
  min-height: 100vh;
}

.global-error {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #fee;
  color: #c33;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  max-width: 400px;
}

.global-error button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #c33;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.global-error button:hover {
  background: #a22;
}
</style>


