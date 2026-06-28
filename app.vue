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

const isHydrating = ref(true)

onMounted(() => {
  // Simple: just wait for plugin to finish, then hide loader
  // Plugin emits 'app:plugin-ready' when done
  const handlePluginReady = () => {
    isHydrating.value = false
  }
  
  // Listen for plugin completion signal
  if (window.__appPluginReady) {
    handlePluginReady()
  } else {
    window.addEventListener('app:plugin-ready', handlePluginReady)
  }
})
</script>

<style scoped>
/* ... keep existing styles ... */
</style>

