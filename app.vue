<!-- app.vue - UPDATED VERSION -->
<template>
  <NuxtLayout>
    <div id="app">
      <NuxtPage />
      
      <!-- Global Notifications -->
      <NotificationToast />
      
      <!-- Global Loading -->
      <GlobalLoading v-if="isLoading" />
      
      <!-- Global Error -->
      <ErrorBoundary v-if="globalError" class="global-error">
        <p>{{ globalError }}</p>
        <button @click="clearError">Dismiss</button>
      </ErrorBoundary>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useUserStore } from '~/stores/user'
import { useSocket } from '~/composables/useSocket'

// Stores
const userStore = useUserStore()

// Composables
const { initializeSocket } = useSocket()

// Reactive data
const isLoading = ref(false)
const globalError = ref<string | null>(null)

// Lifecycle
onMounted(async () => {
  try {
    isLoading.value = true
    
    // Initialize user session
    await userStore.initializeSession()
    
    // Initialize socket connection if user is authenticated
    if (userStore.isAuthenticated) {
      await initializeSocket()
    }
    
  } catch (error: any) {
    console.error('App initialization error:', error)
    globalError.value = error.message || 'Failed to initialize application'
  } finally {
    isLoading.value = false
  }
})

// Clear error
const clearError = () => {
  globalError.value = null
}

// Watch for user changes
watch(() => userStore.isAuthenticated, async (isAuth) => {
  if (isAuth) {
    try {
      await initializeSocket()
    } catch (error: any) {
      console.error('Socket initialization error:', error)
    }
  }
})
</script>

<style>
/* Global styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f5f5f5;
}

#app {
  height: 100vh;
  overflow: hidden;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* Focus styles */
button:focus,
input:focus,
textarea:focus,
select:focus {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}

/* Global error */
.global-error {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #f44336;
  color: white;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  max-width: 400px;
}

.global-error button {
  background: white;
  color: #f44336;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 8px;
}

/* Animation utilities */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(10px);
}
</style>
