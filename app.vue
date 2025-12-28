<!-- /app.vue -->
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
    
    const isLoggingOut = route.query.logout === 'true'
    
    if (isLoggingOut) {
      console.log('[App] User is logging out, clearing session')
      authStore.clearAuth()
      isInitializing.value = false
      return
    }
    
    const sessionInitialized = authStore.initializeSession()
    
    if (sessionInitialized) {
      console.log('[App] ✅ Session restored from storage')
      console.log('[App] User:', authStore.userDisplayName)
      console.log('[App] Authenticated:', authStore.isAuthenticated)
      
      if (!authStore.token || !authStore.user) {
        console.warn('[App] ⚠️ Session data incomplete, clearing')
        authStore.clearAuth()
      }
    } else {
      console.log('[App] ℹ️ No previous session found')
    }

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
  border-radius: 0.25rem;
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
  padding: 0.5rem 1rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

.error-content button:hover {
  background-color: #764ba2;
}
</style>
