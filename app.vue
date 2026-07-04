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
import { ref, onMounted } from 'vue'
import { useUserStore } from '~/stores/user' // Unified store

const isHydrating = ref(true)
const userStore = useUserStore()

onMounted(async () => {
  // 1. Initialize the unified session
  await userStore.initializeSession()

  // 2. Hide loader when ready
  const handlePluginReady = () => {
    isHydrating.value = false
  }
  
  if (window.__appPluginReady) {
    handlePluginReady()
  } else {
    window.addEventListener('app:plugin-ready', handlePluginReady)
  }
})
</script>
