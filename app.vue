// ============================================================================
// FILE 3: /app.vue - COMPLETE APP INITIALIZATION
// ============================================================================
// FIXES:
// ✅ Initialize auth store on app load
// ✅ Ensure session is hydrated before rendering
// ✅ Add loading state while hydrating
// ✅ Prevent flash of unauthenticated content
// ============================================================================

<template>
  <div id="app" class="app-container">
    <!-- ====================================================================== -->
    <!-- LOADING STATE - Show while hydrating -->
    <!-- ====================================================================== -->
    <div v-if="isHydrating" class="hydration-loader">
      <div class="loader-content">
        <div class="spinner"></div>
        <p class="loader-text">Loading SocialVerse...</p>
      </div>
    </div>

    <!-- ====================================================================== -->
    <!-- MAIN APP CONTENT - Show after hydration complete -->
    <!-- ====================================================================== -->
    <div v-else class="app-content">
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">  
import { ref, onMounted, watch } from 'vue'  
// ============================================================================  
// COMPONENT STATE  
// ============================================================================  
const isHydrating = ref(true)  
// ============================================================================  
// GET STORES  
// ============================================================================  
const authStore = useAuthStore()  
const profileStore = useProfileStore()  
// ============================================================================  
// INITIALIZE APP ON MOUNT  
// ============================================================================  
onMounted(async () => {  
  console.log('[App] ============ APP INITIALIZATION START ============')  
  console.log('[App] Component mounted, starting hydration...')  
  try {  
    // ============================================================================  
    // STEP 1: Initialize auth store  
    // ============================================================================  
    console.log('[App] STEP 1: Initializing auth store...')  
      
    if (!authStore.isHydrated) {  
      console.log('[App] Auth store not hydrated, initializing...')  
      await authStore.initializeSession()  
      console.log('[App] ✅ Auth store initialized')  
    } else {  
      console.log('[App] Auth store already hydrated')  
    }  
    // ============================================================================  
    // STEP 2: Initialize profile store  
    // ============================================================================  
    console.log('[App] STEP 2: Initializing profile store...')  
      
    if (!profileStore.isHydrated) {  
      console.log('[App] Profile store not hydrated, initializing...')  
      await profileStore.hydrateFromStorage()  
      console.log('[App] ✅ Profile store hydrated')  
    } else {  
      console.log('[App] Profile store already hydrated')  
    }  
    // ============================================================================  
    // STEP 3: If user is authenticated, initialize profile  
    // ============================================================================  
    console.log('[App] STEP 3: Checking authentication status...')  
      
    if (authStore.isAuthenticated && authStore.user?.id) {  
      console.log('[App] User is authenticated:', authStore.user.id)  
      console.log('[App] Initializing profile for user...')  
        
      await profileStore.initializeProfile(authStore.user.id)  
      console.log('[App] ✅ Profile initialized')  
    } else {  
      console.log('[App] User is not authenticated')  
    }  
    // ============================================================================  
    // STEP 4: Setup auth state change listener  
    // ============================================================================  
    console.log('[App] STEP 4: Setting up auth state change listener...')  
      
    setupAuthStateListener()  
    console.log('[App] ✅ Auth state listener set up')  
    console.log('[App] ✅ App initialization complete')  
    console.log('[App] ============ APP INITIALIZATION END ============')  
  } catch (err: any) {  
    console.error('[App] ============ INITIALIZATION ERROR ============')  
    console.error('[App] Error:', err.message)  
    console.error('[App] ============ END ERROR ============')  
    // Continue anyway - app should still work  
  } finally {  
    // ============================================================================  
    // STEP 5: Hide loading state  
    // ============================================================================  
    console.log('[App] Hiding loading state...')  
    isHydrating.value = false  
    console.log('[App] ✅ App ready for user interaction')  
  }  
})  
// ============================================================================  
// SETUP AUTH STATE CHANGE LISTENER  
// ============================================================================  
const setupAuthStateListener = () => {  
  console.log('[App] Setting up auth state change watcher...')  
  // Watch for authentication changes  
  watch(  
    () => authStore.isAuthenticated,  
    async (isAuthenticated) => {  
      console.log('[App] Auth state changed:', isAuthenticated)  
      if (isAuthenticated && authStore.user?.id) {  
        console.log('[App] User authenticated, initializing profile...')  
        await profileStore.initializeProfile(authStore.user.id)  
        console.log('[App] ✅ Profile initialized on auth change')  
      } else {  
        console.log('[App] User not authenticated, clearing profile...')  
        profileStore.clearProfile()  
        console.log('[App] ✅ Profile cleared on logout')  
      }  
    }  
  )  
  // Watch for user changes  
  watch(  
    () => authStore.user?.id,  
    async (userId) => {  
      if (userId) {  
        console.log('[App] User ID changed:', userId)  
        console.log('[App] Initializing profile for new user...')  
        await profileStore.initializeProfile(userId)  
        console.log('[App] ✅ Profile initialized for new user')  
      }  
    }  
  )  
  console.log('[App] ✅ Auth state change watcher set up')  
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

/* ========================================================================== */
/* HYDRATION LOADER STYLES */
/* ========================================================================== */
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loader-text {
  color: white;
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0;
  letter-spacing: 0.5px;
}

/* ========================================================================== */
/* RESPONSIVE STYLES */
/* ========================================================================== */
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
