<script setup lang="ts">
import { ref, onMounted, onBeforeMount } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const authStore = useAuthStore()

const isInitializing = ref(true)
const isLoading = ref(false)
const supabaseError = ref(false)
const globalError = ref<string | null>(null)

// ✅ CRITICAL FIX: Hydrate BEFORE component mounts
onBeforeMount(async () => {
  console.log('[App] 🚀 Before mount - hydrating auth store...')
  
  if (process.client) {
    try {
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('auth_user')
      const storedUserId = localStorage.getItem('auth_user_id')
      
      if (storedToken && storedUser && storedUserId) {
        try {
          const user = JSON.parse(storedUser)
          authStore.setToken(storedToken)
          authStore.setUserId(storedUserId)
          authStore.setUser(user)
          console.log('[App] ✅ Auth state restored before mount')
        } catch (e) {
          console.error('[App] Failed to parse stored user:', e)
          authStore.clearAuth()
        }
      }
      
      authStore.isHydrated = true
    } catch (error) {
      console.error('[App] Hydration error:', error)
      authStore.isHydrated = true
    }
  }
})

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
    
    if (authStore.token && authStore.user) {
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

    // ✅ FIXED: Safely check for Supabase without destructuring
    const nuxtApp = useNuxtApp()
    const supabaseClient = nuxtApp.$supabase
    
    if (!supabaseClient) {
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
        <div v-if="globalError" class="global-error">
          <div class="error-content">
            <h2>Something went wrong</h2>
            <p>{{ globalError }}</p>
            <button @click="clearError">Dismiss</button>
          </div>
        </div>
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.supabase-error-banner p {
  margin: 0;
  color: #92400e;
  font-weight: 500;
}

.supabase-error-banner button {
  background-color: #fbbf24;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.supabase-error-banner button:hover {
  background-color: #f59e0b;
  transform: translateY(-1px);
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
  backdrop-filter: blur(4px);
}

.error-content {
  background-color: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  text-align: center;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-content h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #dc2626;
  font-size: 1.5rem;
}

.error-content p {
  margin-bottom: 1.5rem;
  color: #666;
}

.error-content button {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.error-content button:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
}
</style>
