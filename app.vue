<!-- FILE: /app.vue (FIXED - Session Initialization) -->
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
          <h2>Something went wrong</h2>
          <p>{{ globalError }}</p>
          <button @click="clearError">Dismiss</button>
        </div>
      </ErrorBoundary>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const authStore = useAuthStore()

const isInitializing = ref(true)
const isLoading = ref(false)
const supabaseError = ref(false)
const gunError = ref(false)
const globalError = ref<string | null>(null)

/**
 * Initialize app on mount
 */
onMounted(async () => {
  try {
    console.log('[App] 🚀 Initializing application...')
    
    // Initialize auth session from localStorage
    const sessionInitialized = await authStore.initializeSession()
    
    if (sessionInitialized) {
      console.log('[App] ✅ Session restored from storage')
      console.log('[App] User:', authStore.userDisplayName)
    } else {
      console.log('[App] ℹ️ No previous session found')
    }

    // TODO: Initialize other services (Supabase, GUN, etc.)
    
  } catch (error) {
    console.error('[App] Error during initialization:', error)
    globalError.value = error instanceof Error ? error.message : 'Initialization failed'
  } finally {
    isInitializing.value = false
  }
})

const retryInitialization = () => {
  supabaseError.value = false
  // Retry logic here
}

const dismissGunError = () => {
  gunError.value = false
}

const clearError = () => {
  globalError.value = null
}
</script>

<style scoped>
.supabase-error-banner,
.gun-error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 1rem;
  margin: 1rem;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.supabase-error-banner p,
.gun-error-banner p {
  margin: 0;
}

.supabase-error-banner button,
.gun-error-banner button {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.global-error {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 9999;
}

.error-content h2 {
  margin-top: 0;
  color: #dc2626;
}

.error-content button {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
</style>
