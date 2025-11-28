<!-- FILE: /app.vue -->
<!-- ✅ FIXED - Comprehensive error handling including GUN errors -->

<template>
  <NuxtLayout>
    <div id="app">
      <!-- Show error if Supabase not ready -->
      <div v-if="supabaseError && !isInitializing" class="supabase-error-banner">
        <p>⚠️ Database connection unavailable. Some features may be limited.</p>
        <button @click="retryInitialization">Retry</button>
      </div>

      <!-- Show error if GUN failed -->
      <div v-if="gunError && !isInitializing" class="gun-error-banner">
        <p>⚠️ Peer-to-peer connection unavailable. Using standard mode.</p>
        <button @click="dismissGunError">Dismiss</button>
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
const gunError = ref<Error | null>(null)  // ✅ ADDED: GUN error tracking
const initializationAttempts = ref(0)
const maxRetries = 3

// Computed
const hasError = computed(() => globalError.value !== null || supabaseError.value !== null)

/**
 * ✅ FIXED: Initialize application with proper error handling and logging
 * Includes GUN error handling
 */
const initializeApp = async () => {
  try {
    console.log('[App] Starting initialization...')
    isInitializing.value = true
    isLoading.value = true
    globalError.value = null
    supabaseError.value = null
    gunError.value = null  // ✅ ADDED: Reset GUN error

    // Wait a tick to ensure plugins are loaded
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check if Supabase is ready
    const supabase = useNuxtApp().$supabase
    const supabaseReady = useNuxtApp().$supabaseReady
    const supabaseErr = useNuxtApp().$supabaseError

    if (!supabaseReady) {
      console.warn('[App] ⚠️ Supabase not ready, running in degraded mode')
      supabaseError.value = supabaseErr || new Error('Supabase initialization failed')
      
      if (typeof window !== 'undefined' && window.console) {
        console.error('[App] Supabase Error Details:', {
          ready: supabaseReady,
          error: supabaseErr?.message,
          timestamp: new Date().toISOString(),
        })
      }
    }

    // ✅ ADDED: Check if GUN is ready (but don't fail if it's not)
    const gun = useNuxtApp().$gun
    if (!gun) {
      console.warn('[App] ⚠️ GUN not available, P2P features disabled')
      gunError.value = new Error('GUN initialization failed')
    }

    // Initialize user session if authenticated
    if (userStore.isAuthenticated && supabase) {
      console.log('[App] Initializing session for authenticated user')
      try {
        await userStore.initializeSession()
        console.log('[App] ✅ Session initialized successfully')
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        console.error('[App] ❌ Session initialization failed:', err.message)
        console.error('[App] Session Error Stack:', err.stack)
        supabaseError.value = err
      }
    }

    console.log('[App] ✅ Application initialized successfully')
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[App] ❌ Initialization error:', err.message)
    console.error('[App] Error Stack:', err.stack)
    globalError.value = err.message
  } finally {
    isInitializing.value = false
    isLoading.value = false
  }
}

/**
 * ✅ FIXED: Retry initialization with exponential backoff
 */
const retryInitialization = async () => {
  if (initializationAttempts.value >= maxRetries) {
    globalError.value = 'Maximum retry attempts reached. Please refresh the page.'
    console.error('[App] ❌ Max retries reached')
    return
  }
  
  initializationAttempts.value++
  const delay = Math.pow(2, initializationAttempts.value) * 1000
  
  console.log(`[App] Retry attempt ${initializationAttempts.value}/${maxRetries} (waiting ${delay}ms)`)
  
  await new Promise(resolve => setTimeout(resolve, delay))
  await initializeApp()
}

/**
 * Clear error
 */
const clearError = () => {
  globalError.value = null
}

/**
 * ✅ ADDED: Dismiss GUN error
 */
const dismissGunError = () => {
  gunError.value = null
}

/**
 * Lifecycle
 */
onMounted(async () => {
  console.log('[App] Component mounted, starting initialization')
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
  color: #92e;
  font-weight: 500;
}

.supabase-error-banner button {
  background-color: #f59e0b;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.supabase-error-banner button:hover {
  background-color: #d97706;
}

/* ✅ ADDED: GUN error banner styling */
.gun-error-banner {
  background-color: #dbeafe;
  border: 1px solid #0ea5e9;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gun-error-banner p {
  margin: 0;
  color: #0c4a6e;
  font-weight: 500;
}

.gun-error-banner button {
  background-color: #0ea5e9;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.gun-error-banner button:hover {
  background-color: #0284c7;
}

.global-error {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 0.375rem;
  padding: 1rem;
  max-width: 400px;
  z-index: 9999;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.error-content h3 {
  margin: 0 0 0.5rem 0;
  color: #991b1b;
  font-size: 1rem;
}

.error-content p {
  margin: 0 0 1rem 0;
  color: #7f1d1d;
  font-size: 0.875rem;
}

.error-content button {
  background-color: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.error-content button:hover {
  background-color: #b91c1c;
}
</style>
