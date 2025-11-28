<!-- FILE: /app.vue -->
<!-- ✅ FIXED - Proper error handling and initialization timing -->
<!-- Addresses: Issue #2 (Timing), Issue #3 (Pinia init) -->

<template>
  <NuxtLayout>
    <div id="app">
      <!-- Show error if Supabase not ready -->
      <div v-if="supabaseError && !isInitializing" class="supabase-error-banner">
        <p>⚠️ Database connection unavailable. Some features may be limited.</p>
        <button @click="retryInitialization">Retry</button>
      </div>

      <!-- Main content -->
      <NuxtPage />
      
      <!-- Global Notifications -->
      <NotificationToast />
      
      <!-- Global Loading -->
      <GlobalLoading v-if="isLoading" />
      
      <!-- Global Error Boundary -->
      <ErrorBoundary v-if="globalError" class="global-error">
        <div class="error-content">
          <h3>Something went wrong</h3>
          <p>{{ globalError }}</p>
          <button @click="clearError">Dismiss</button>
        </div>
      </ErrorBoundary>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '~/stores/user'

// Stores
const userStore = useUserStore()

// Reactive data
const isLoading = ref(false)
const isInitializing = ref(true)
const globalError = ref<string | null>(null)
const supabaseError = ref<Error | null>(null)
const initializationAttempts = ref(0)
const maxRetries = 3

// Computed
const hasError = computed(() => globalError.value !== null || supabaseError.value !== null)

/**
 * Initialize application with proper error handling
 * Addresses: Issue #2 (Timing) - Wait for Supabase before initializing stores
 */
const initializeApp = async () => {
  try {
    console.log('[App] Starting initialization...')
    isInitializing.value = true
    isLoading.value = true
    globalError.value = null
    supabaseError.value = null

    // Wait a tick to ensure plugins are loaded
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check if Supabase is ready (Addresses Issue #1)
    const supabase = useNuxtApp().$supabase
    const supabaseReady = useNuxtApp().$supabaseReady
    const supabaseErr = useNuxtApp().$supabaseError

    if (!supabaseReady) {
      console.warn('[App] Supabase not ready, running in degraded mode')
      supabaseError.value = supabaseErr || new Error('Supabase initialization failed')
    }

    // Initialize user session if authenticated (Addresses Issue #3)
    if (userStore.isAuthenticated && supabase) {
      console.log('[App] Initializing session for authenticated user')
      try {
        await userStore.initializeSession()
        console.log('[App] ✅ Session initialized')
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        console.error('[App] Session initialization failed:', err.message)
        // Don't fail completely, allow app to continue
        supabaseError.value = err
      }
    }

    console.log('[App] ✅ Application initialized successfully')
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[App] Initialization error:', err.message)
    globalError.value = err.message
  } finally {
    isInitializing.value = false
    isLoading.value = false
  }
}

/**
 * Retry initialization
 */
const retryInitialization = async () => {
  if (initializationAttempts.value >= maxRetries) {
    globalError.value = 'Maximum retry attempts reached'
    return
  }
  
  initializationAttempts.value++
  console.log(`[App] Retry attempt ${initializationAttempts.value}/${maxRetries}`)
  await initializeApp()
}

/**
 * Clear error
 */
const clearError = () => {
  globalError.value = null
}

/**
 * Lifecycle
 */
onMounted(async () => {
  await initializeApp()
})
</script>

<style scoped>
.supabase-error-banner {
  background-color: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.supabase-error-banner p {
  margin: 0;
  color: #92400e;
  font-weight: 500;
}

.supabase-error-banner button {
  background-color: #f59e0b;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
}

.supabase-error-banner button:hover {
  background-color: #d97706;
}

.global-error {
  background-color: #fee2e2;
  border: 1px solid #ef4444;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-top: 1rem;
}

.error-content h3 {
  color: #991b1b;
  margin-top: 0;
}

.error-content p {
  color: #7f1d1d;
  margin: 0.5rem 0;
}

.error-content button {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
}

.error-content button:hover {
  background-color: #dc2626;
}
</style>
