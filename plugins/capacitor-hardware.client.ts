// ============================================================================
// FILE: /plugins/capacitor-hardware.client.ts - FIXED VERSION
// ============================================================================
// ✅ FIXED: Added dependsOn declaration
// ✅ FIXED: Added error handling and logging
// ✅ FIXED: Added process.client check
// ============================================================================

import { defineNuxtPlugin, useRouter } from '#app'
import { App as CapacitorApp } from '@capacitor/app'

export default defineNuxtPlugin({
  name: 'socialverse-capacitor-hardware',

  // ✅ FIX: Ensure Pinia and Router are loaded before hardware hooks
  dependsOn: ['pinia'],

  setup(_nuxtApp: any) {
    if (!process.client) return

    console.log('[Capacitor Hardware Plugin] Initializing native hardware interceptors')

    try {
      const router = useRouter()

      // 1. Listen for the native Android/Device hardware back button event stream
      CapacitorApp.addListener('backButton', (_event) => {
        try {
          const currentPath = router.currentRoute.value.path

          // Check current structural layout state - if on primary roots, exit app context safely
          if (currentPath === '/' || currentPath === '/auth/login' || currentPath === '/login') {
            // No deeper navigation history left; minimize or exit the native window container
            console.log('[Capacitor Hardware Plugin] Exiting app from root path:', currentPath)
            CapacitorApp.exitApp()
          } else {
            // 2. Map the physical hardware back push onto the Nuxt dynamic routing layer
            console.log('[Capacitor Hardware Plugin] Navigating back from:', currentPath)
            router.back()
          }
        } catch (error) {
          console.error('[Capacitor Hardware Plugin] Error handling back button:', error)
        }
      })

      console.log('[Capacitor Hardware Plugin] ✅ Native hardware navigation synchronized safely')
    } catch (err) {
      console.warn('[Capacitor Hardware Plugin] ⚠️ Discovered non-native runtime context shell:', err)
      // Gracefully continue - this is expected in web-only environments
    }
  }
})

