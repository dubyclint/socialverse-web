<template>
  <div id="app" class="app-container">
    <div v-if="isHydrating" class="hydration-loader">
      <div class="loader-content">
        <div class="spinner"></div>
        <p class="loader-text">Loading SocialVerse...</p>
      </div>
    </div>

    <div v-else class="app-content">
      <NuxtPage />
    </div>

    <ClientOnly>
      <Sonner />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

// ============================================================================
// COMPONENT STATE
// ============================================================================
const isHydrating = ref(true)

// ============================================================================
// HELPERS
// ============================================================================
const getCleanUserId = (value: unknown): string => {
  return String(value || '')
    .split(':')[0]
    .trim()
}

// ============================================================================
// INITIALIZE APP ON MOUNT - SEQUENTIAL LAZY IMPORT
// ============================================================================
onMounted(async () => {
  console.log('[App] ============ APP INITIALIZATION START ============')

  try {
    // STEP 1: Import and hydrate Auth Store completely first
    const { useAuthStore } = await import('~/stores/auth')
    const authStore = useAuthStore()

    if (!authStore.isHydrated) {
      if (typeof authStore.initializeSession === 'function') {
        await authStore.initializeSession()
      } else if (typeof authStore.hydrateFromStorage === 'function') {
        await authStore.hydrateFromStorage()
      }
      console.log('[App] ✅ Auth store hydrated')
    }

    // STEP 2: Import and hydrate Profile Store next
    const { useProfileStore } = await import('~/stores/profile')
    const profileStore = useProfileStore()

    if (!profileStore.isHydrated) {
      await profileStore.hydrateFromStorage()
      console.log('[App] ✅ Profile store hydrated')
    }

    // STEP 3: Initialize profile data if authenticated context exists
    if (authStore.isAuthenticated && (authStore.userId || authStore.user?.id)) {
      await initializeProfileForCurrentUser(authStore, profileStore)
      console.log('[App] ✅ Profile initialization done')
    } else {
      console.log('[App] Unauthenticated session detected.')
    }

    // STEP 4: Bind reactive dependency updates safely
    setupAuthStateListener(authStore, profileStore)
    console.log('[App] ✅ Auth state listeners set up')
  } catch (err: any) {
    console.error('[App] ============ INITIALIZATION ERROR ============')
    console.error('[App] Error:', err?.message || err)
    console.error('[App] ============ END ERROR ============')
  } finally {
    // STEP 5: Dismount hydration view
    isHydrating.value = false
    console.log('[App] ✅ App ready')
    console.log('[App] ============ APP INITIALIZATION END ============')
  }
})

// ============================================================================
// HELPER: Initialize profile for current user
// ============================================================================
const initializeProfileForCurrentUser = async (authStore: any, profileStore: any) => {
  const rawUserId = authStore.userId || authStore.user?.id
  const token = authStore.token

  if (!rawUserId || !token) {
    console.log('[App] No authenticated user/token, skipping profile fetch.')
    return
  }

  const cleanUserId = getCleanUserId(rawUserId)
  if (!cleanUserId) return

  // Avoid duplicate network overhead if profile matches current verified session
  const currentProfileId = getCleanUserId(profileStore.profile?.id || profileStore.profile?.user_id)
  if (currentProfileId && currentProfileId === cleanUserId) {
    console.log('[App] Profile already initialized for user:', cleanUserId)
    return
  }

  console.log('[App] Fetching profile for user:', cleanUserId)
  // ✅ FIXED: profileStore.fetchProfile pulls from its own context natively.
  // Passing parameter matches signature safely without injecting arguments into internal fetch hooks.
  await profileStore.fetchProfile()
}

// ============================================================================
// HELPER: Setup auth state listeners
// ============================================================================
const setupAuthStateListener = (authStore: any, profileStore: any) => {
  // Watch auth boolean changes
  watch(
    () => authStore.isAuthenticated,
    async (isAuthenticated) => {
      console.log('[App] Auth state changed:', isAuthenticated)

      if (isAuthenticated && (authStore.userId || authStore.user?.id)) {
        await initializeProfileForCurrentUser(authStore, profileStore)
      } else {
        profileStore.clearProfile()
      }
    }
  )

  // Watch user ID transitions
  watch(
    () => authStore.userId || authStore.user?.id,
    async (newUserId, oldUserId) => {
      const newId = getCleanUserId(newUserId)
      const oldId = getCleanUserId(oldUserId)

      if (newId && newId !== oldId) {
        console.log('[App] User ID changed:', newId)
        await initializeProfileForCurrentUser(authStore, profileStore)
      }
    }
  )
}
</script>

<style scoped>
.app-container {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
}

.app-content {
  width: 100%;
  min-height: 100vh;
}

/* HYDRATION LOADER STYLES */
.hydration-loader {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  width: 100%;
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loader-text {
  color: white;
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0;
  letter-spacing: 0.5px;
}

/* RESPONSIVE STYLES */
@media (max-width: 768px) {
  .loader-text {
    font-size: 1rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border-width: 3px;
  }
}
</style>

