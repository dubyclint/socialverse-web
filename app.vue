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
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

// ============================================================================
// CRITICAL: Initialize auth store on client side only
// ============================================================================
const authStore = useAuthStore()
const router = useRouter()

/**
 * ✅ FIX: Handle Supabase auth hash redirect
 * When user clicks email verification link, Supabase redirects to:
 * https://socialverse-web.zeabur.app/#access_token=xxx&type=signup
 * We need to redirect this to /auth/verify-email with the hash preserved
 */
const handleAuthHashRedirect = () => {
  const hash = window.location.hash
  const path = window.location.pathname

  console.log('[App] ============ AUTH HASH REDIRECT CHECK ============')
  console.log('[App] Current path:', path)
  console.log('[App] Current hash:', hash)

  // ✅ If we're on root path with access_token in hash, redirect to verify-email
  if (path === '/' && hash && hash.includes('access_token')) {
    console.log('[App] ✅ Detected Supabase auth hash on root path')
    console.log('[App] Redirecting to /auth/verify-email with hash preserved')
    
    // Use window.location to preserve the hash and perform a full redirect
    window.location.href = `/auth/verify-email${hash}`
    return true
  }

  console.log('[App] ℹ️ No auth hash redirect needed')
  console.log('[App] ============ AUTH HASH REDIRECT CHECK END ============')
  return false
}

// Initialize auth when component mounts (client-side only)
onMounted(async () => {
  console.log('[App] 🚀 Initializing application...')
  
  // ✅ FIRST: Check for Supabase auth hash redirect
  if (handleAuthHashRedirect()) {
    // If redirect happened, stop here
    return
  }

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
