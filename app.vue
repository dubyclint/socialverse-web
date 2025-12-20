<!-- FILE: /app.vue - FIXED FOR SSR HYDRATION -->
<template>
  <NuxtLayout>
    <div id="app">
      <!-- Show error if Supabase not ready (client-only) -->
      <ClientOnly>
        <div v-if="supabaseError && !isInitializing" class="supabase-error-banner">
          <p>⚠️ Database connection unavailable. Some features may be limited.</p>
          <button @click="retryInitialization">Retry</button>
        </div>
      </ClientOnly>

      <!-- Main content -->
      <NuxtPage />
      
      <!-- Global Notifications (client-only) -->
      <ClientOnly>
        <NotificationToast />
      </ClientOnly>
      
      <!-- Global Loading (client-only) -->
      <ClientOnly>
        <GlobalLoading v-if="isLoading" />
      </ClientOnly>
      
      <!-- Global Error Boundary (client-only) -->
      <ClientOnly>
        <ErrorBoundary v-if="globalError" class="global-error">
          <div class="error-content">
            <h2>Something went wrong</h2>
            <p>{{ globalError }}</p>
            <button @click="clearError">Dismiss</button>
          </div>
        </ErrorBoundary>
      </ClientOnly>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const authStore = useAuthStore()
const { $supabase } = useNuxtApp()

const isInitializing = ref(true)
const isLoading = ref(false)
const supabaseError = ref()
const globalError = ref<string | null>(null)

/**
 * Initialize app on mount (client-only)
 */
onMounted(async () => {
  try {
    console.log('[App] 🚀 Initializing application...')
    
    // ✅ Initialize auth session from localStorage (client-only)
    const sessionInitialized = authStore.initializeSession()
    
    if (sessionInitialized) {
      console.log('[App] ✅ Session restored from storage')
      console.log('[App] User:', authStore.userDisplayName)
    } else {
      console.log('[App] ℹ️ No previous session found')
    }

    // Check Supabase availability
    if (!$supabase) {
      console.warn('[App] Supabase not available')
      supabaseError.value = true
    } else {
      console.log('[App] ✅ Supabase ready')
      supabaseError.value = false
    }
    
    isInitializing.value = false
    console.log('[App] ✅ Initialization complete')
  } catch (error) {
    console.error('[App] Initialization error:', error)
    globalError.value = 'Failed to initialize application'
    isInitializing.value = false
  }
})

/**
 * Retry initialization
 */
const retryInitialization = async () => {
  isInitializing.value = true
  supabaseError.value = false
  await new Promise(resolve => setTimeout(resolve, 1000))
  isInitializing.value = false
}

/**
 * Clear error
 */
const clearError = () => {
  globalError.value = null
}
</script>

<style scoped>
.supabase-error-banner {
  background-color: #fef3c7;
  border: 1px solid #fcd34d;
  padding: 1rem;
  margin: 1rem;
  border-radius: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.supabase-error-banner button {
  background-color: #f59e0b;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius:.25rem;
  cursor: pointer;
}

.supabase-error-banner button:hover {
  background-color: #d97706;
}

.global-error {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.error-content {
  background-color: white;
  padding: 2rem;
  border-radius: 0.5rem;
  max-width: 500px;
  text-align: center;
}

.error-content button {
  margin-top: 1rem;
  background-color: #ef4444;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

.error-content button:hover {
  background-color: #dc2626;
}
</style>
