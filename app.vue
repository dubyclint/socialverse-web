<template>
  <div>
    <!-- ============================================================================
         CRITICAL: Wrap entire app in ClientOnly to prevent hydration mismatches
         The auth store uses localStorage which is only available on client
         ============================================================================ -->
    <ClientOnly>
      <!-- Initialize auth on client mount -->
      <div v-if="!authStore.isHydrated" class="hydration-loading">
        <div class="spinner"></div>
        <p>Initializing...</p>
      </div>
      
      <!-- Main app content (only render after hydration) -->
      <div v-else>
        <NuxtLayoutErrorBoundary>
          <template #default>
            <NuxtPage />
          </template>
          <template #error="{ error }">
            <div class="error-boundary">
              <h1>Something went wrong</h1>
              <p>{{ error.message }}</p>
              <NuxtLink to="/">Go Home</NuxtLink>
            </div>
          </template>
        </NuxtLayoutErrorBoundary>
      </div>

      <!-- Fallback during hydration -->
      <template #fallback>
        <div class="hydration-loading">
          <div class="spinner"></div>
          <p>Loading...</p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { onMounted } from 'vue'

// ============================================================================
// CRITICAL: Initialize auth store on client side only
// ============================================================================
const authStore = useAuthStore()

// Initialize auth when component mounts (client-side only)
onMounted(async () => {
  console.log('[App] 🚀 Initializing application...')
  
  try {
    // Check if we have a previous session
    if (authStore.token && authStore.user) {
      console.log('[App] ℹ️ Previous session found, validating...')
      const isValid = await authStore.validateToken()
      if (!isValid) {
        console.warn('[App] ⚠️ Previous session invalid, clearing...')
        authStore.clearAuth()
      }
    } else {
      console.log('[App] ℹ️ No previous session found')
    }

    // Hydrate from localStorage
    await authStore.hydrateFromStorage()
    console.log('[App] ✅ Supabase ready')
  } catch (error) {
    console.error('[App] ❌ Initialization error:', error)
    authStore.clearAuth()
  }

  console.log('[App] ✅ Initialization complete')
})
</script>

<style scoped>
.hydration-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f9fafb;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.hydration-loading p {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
}

.error-boundary {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f9fafb;
  text-align: center;
  padding: 2rem;
}

.error-boundary h1 {
  color: #dc2626;
  margin-bottom: 1rem;
}

.error-boundary p {
  color: #6b7280;
  margin-bottom: 2rem;
  max-width: 500px;
}

.error-boundary a {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.3s;
}

.error-boundary a:hover {
  background: #2563eb;
}
</style>
