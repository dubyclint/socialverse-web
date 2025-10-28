// ============================================================================
// plugins/gun-client.ts - GUN DATABASE CLIENT PLUGIN
// ============================================================================
// Gun is DISABLED during sign-up/login
// Gun initializes ONLY after user is authenticated

import Gun from 'gun/gun'
import 'gun/sea'

declare global {
  interface Window {
    $gun?: any
  }
}

let gunInstance: any = null

export default defineNuxtPlugin(() => {
  console.log('[Gun] Plugin loaded - Gun will initialize after authentication')
  
  // Gun is disabled by default - will be enabled by auth store after sign-in
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
      // Function to initialize Gun after auth
      initializeGun: (config?: any) => {
        try {
          console.log('[Gun] Initializing Gun after authentication...')
          gunInstance = Gun({
            peers: config?.peers || ['https://gun-messaging-peer.herokuapp.com/gun'],
            localStorage: false,
            radisk: false,
          })
          if (process.client) {
            window.$gun = gunInstance
          }
          console.log('[Gun] Gun initialized successfully')
          return gunInstance
        } catch (err) {
          console.error('[Gun] Initialization failed:', err)
          return null
        }
      }
    }
  }
})
