// ============================================================================
// plugins/gun-client.ts - GUN DATABASE CLIENT PLUGIN (FIXED)
// ============================================================================
// ✅ FIXES:
// - Disabled history manipulation (causes "Cannot set property state" error)
// - Disabled localStorage to prevent conflicts
// - Added proper error handling
// - Only initialize after authentication

import Gun from 'gun/gun'
import 'gun/sea'

declare global {
  interface Window {
    $gun?: any
  }
}

let gunInstance: any = null

export default defineNuxtPlugin(() => {
  console.log('[Gun] Plugin loaded - waiting for authentication')
  
  // ✅ Gun is disabled by default - will be enabled by auth store after sign-in
  gunInstance = {
    get: (key: string) => ({
      on: (callback: Function) => {},
      once: (callback: Function) => {},
      put: (data: any) => ({ on: () => {}, once: () => {} }),
    }),
    put: (data: any) => ({
      on: (callback: Function) => {},
      once: (callback: Function) => {},
    }),
    set: (data: any) => ({
      on: (callback: Function) => {},
      once: (callback: Function) => {},
    }),
  }

  // Make Gun available globally
  if (process.client) {
    window.$gun = gunInstance
  }

  return {
    provide: {
      gun: gunInstance,
      
      // ✅ FIXED: Initialize Gun after auth with proper configuration
      initializeGun: (config?: any) => {
        try {
          console.log('[Gun] Initializing Gun after authentication...')
          
          // ✅ CRITICAL FIXES:
          // 1. Disable history manipulation (prevents "Cannot set property state" error)
          // 2. Disable localStorage (prevents conflicts)
          // 3. Disable radisk (prevents file system issues)
          // 4. Set empty peers (use only local)
          gunInstance = Gun({
            peers: config?.peers || [],
            localStorage: false,  // ✅ FIXED: Disable localStorage
            radisk: false,        // ✅ FIXED: Disable radisk
            // ✅ ADDED: Disable history manipulation
            history: false,
            // ✅ ADDED: Disable indexedDB
            indexedDB: false,
            // ✅ ADDED: Disable sessionStorage
            sessionStorage: false,
          })

          console.log('[Gun] ✅ Gun initialized with safe configuration')
          window.$gun = gunInstance
          return gunInstance
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          console.error('[Gun] ❌ Failed to initialize:', err.message)
          console.error('[Gun] Error Stack:', err.stack)
          return null
        }
      },
      
      // ✅ FIXED: Function to disconnect Gun safely
      disconnectGun: () => {
        if (gunInstance) {
          console.log('[Gun] Disconnecting...')
          try {
            // Safely disconnect without triggering history errors
            if (gunInstance.off && typeof gunInstance.off === 'function') {
              gunInstance.off()
            }
            gunInstance = null
            window.$gun = undefined
            console.log('[Gun] ✅ Disconnected successfully')
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error))
            console.warn('[Gun] ⚠️ Error during disconnect:', err.message)
            gunInstance = null
            window.$gun = undefined
          }
        }
      }
    }
  }
})
