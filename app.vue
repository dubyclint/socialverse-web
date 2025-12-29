FIXED FILE 8: /app.vue (SCRIPT SECTION)
# ============================================================================
# APP.VUE - FIXED: Added hydration call
# ============================================================================
# ✅ FIXED: Added authStore.hydrateFromStorage() call
# ✅ FIXED: Proper initialization order
# ✅ FIXED: Error handling
# ============================================================================

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const authStore = useAuthStore()
const { $supabase } = useNuxtApp()

const isInitializing = ref(true)
const isLoading = ref(false)
const supabaseError = ref()
const globalError = ref<string | null>(null)

onMounted(async () => {
  try {
    console.log('[App] 🚀 Initializing application...')
    
    // ============================================================================
    // ✅ FIXED: Hydrate auth store from localStorage FIRST
    // ============================================================================
    console.log('[App] Hydrating auth store from localStorage...')
    authStore.hydrateFromStorage()
    console.log('[App] ✅ Auth store hydrated')
    
    const isLoggingOut = route.query.logout === 'true'
    
    if (isLoggingOut) {
      console.log('[App] User is logging out, clearing session')
      authStore.clearAuth()
      isInitializing.value = false
      return
    }
    
    // ============================================================================
    // Initialize session (if not already hydrated)
    // ============================================================================
    if (!authStore.isAuthenticated) {
      console.log('[App] ℹ️ No previous session found')
    } else {
      console.log('[App] ✅ Session restored from storage')
      console.log('[App] User:', authStore.userDisplayName)
      console.log('[App] Authenticated:', authStore.isAuthenticated)
      
      if (!authStore.token || !authStore.user) {
        console.warn('[App] ⚠️ Session data incomplete, clearing')
        authStore.clearAuth()
      }
    }

    // ============================================================================
    // Check Supabase availability
    // ============================================================================
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
    authStore.clearAuth()
    isInitializing.value = false
  }
})

const retryInitialization = async () => {
  isInitializing.value = true
  supabaseError.value = false
  await new Promise(resolve => setTimeout(resolve, 1000))
  isInitializing.value = false
}

const clearError = () => {
  globalError.value = null
}
</script>

<template>
  <NuxtLayout>
    <div id="app">
      <ClientOnly>
        <div v-if="supabaseError && !isInitializing" class="supabase-error-banner">
          <p>⚠️ Database connection unavailable. Some features may be limited.</p>
          <button @click="retryInitialization">Retry</button>
        </div>
      </ClientOnly>

      <NuxtPage />
      
      <ClientOnly>
        <NotificationToast />
      </ClientOnly>
      
      <ClientOnly>
        <GlobalLoading v-if="isLoading" />
      </ClientOnly>
      
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

<style scoped>
#app {
  min-height: 100vh;
}

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

.supabase-error-banner p {
  margin: 0;
  color: #92400e;
}

.supabase-error-banner button {
  background-color: #fbbf24;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 600;
}

.supabase-error-banner button:hover {
  background-color: #f59e0b;
}

.global-error {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.error-content {
  background-color: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  text-align: center;
}

.error-content h2 {
  margin-top: 0;
  color: #dc2626;
}

.error-content p {
  color: #666;
  margin-bottom: 1.5rem;
}

.error-content button {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 600;
}

.error-content button:hover {
  background-color: #2563eb;
}
</style>
