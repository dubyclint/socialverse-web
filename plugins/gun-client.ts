// ============================================================================
// plugins/gun-client.ts - GUN DATABASE CLIENT PLUGIN
// ============================================================================
// ✅ Gun is DISABLED during sign-up/login
// ✅ Gun initializes ONLY after user is authenticated

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
      // ✅ Function to initialize Gun after auth
      initializeGun: (config?: any) => {
        try {
          console.log('[Gun] Initializing Gun after authentication...')
          gunInstance = Gun({
            peers: config?.peers || ['https://gun-messaging-peer.herokuapp.com/gun'],
            localStorage: false,
            radisk: false
          })

          console.log('[Gun] ✅ Gun initialized')
          window.$gun = gunInstance
          return gunInstance
        } catch (error) {
          console.error('[Gun] Failed to initialize:', error)
          return null
        }
      },
      
      // ✅ Function to disconnect Gun
      disconnectGun: () => {
        if (gunInstance) {
          console.log('[Gun] Disconnecting...')
          try {
            gunInstance.off()
          } catch (error) {
            console.warn('[Gun] Error during disconnect:', error)
          }
          gunInstance = null
          window.$gun = undefined
        }
      }
    }
  }
})

