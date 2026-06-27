// ============================================================================
// FILE: /plugins/sonner.client.ts - FIXED VERSION
// ============================================================================
// ✅ FIXED: Added proper plugin structure with dependsOn
// ✅ FIXED: Added error handling and logging
// ✅ FIXED: Added process.client check
// ============================================================================

import { defineNuxtPlugin } from '#app'
import { Toaster } from 'vue-sonner'

export default defineNuxtPlugin({
  name: 'socialverse-sonner',

  // ✅ FIX: Ensure Pinia is loaded before Sonner initialization
  dependsOn: ['pinia'],

  setup(nuxtApp) {
    if (!process.client) return

    console.log('[Sonner Plugin] Initializing Sonner toast notification system')

    try {
      // Register Toaster component globally
      nuxtApp.vueApp.component('Sonner', Toaster)

      console.log('[Sonner Plugin] ✅ Sonner toast system registered successfully')

      return {
        provide: {
          sonner: {
            isReady: true
          }
        }
      }
    } catch (error) {
      console.error('[Sonner Plugin] ❌ Initialization failed:', error)

      // ✅ FIX: Provide fallback to prevent app crash
      return {
        provide: {
          sonner: {
            isReady: false
          }
        }
      }
    }
  }
})

