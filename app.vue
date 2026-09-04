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
import { useSupabaseUser } from '#imports'
import { useUserStore } from '~/stores/user'
import { usePresence } from '~/composables/usePresence'
import { useDiscoveryStore } from '~/stores/useDiscovery'

const isHydrating = ref(true)
const supabaseUser = useSupabaseUser()
const userStore = useUserStore()
const discoveryStore = useDiscoveryStore()

// Initialize heartbeat
usePresence()

onMounted(async () => {
  const revealApp = () => {
    isHydrating.value = false
  }

  // Listen before any awaiting so the plugin's event can't be missed
  if (window.__appPluginReady) {
    revealApp()
  } else {
    window.addEventListener('app:plugin-ready', revealApp, { once: true })
  }

  // Pre-fetch session and discovery feed concurrently so the feed is ready as
  // soon as the app loads. Neither may keep the loader on screen if it fails.
  await Promise.allSettled([
    userStore.initializeSession(),
    // The discovery feed requires an authenticated session
    supabaseUser.value ? discoveryStore.warmupFeed() : Promise.resolve()
  ])

  revealApp()
})
</script>
