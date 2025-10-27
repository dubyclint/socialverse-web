// ============================================================================
// plugins/gun-client.ts - GUN DATABASE CLIENT PLUGIN
// ============================================================================
// This plugin initializes Gun instance for decentralized data
// DISABLED BY DEFAULT - Enable only when Gun server is ready

import Gun from 'gun/gun'
import 'gun/sea'

declare global {
  interface Window {
    $gun?: any
  }
}

// Initialize Gun instance with error handling
let gunInstance: any = null

try {
  // DISABLED: Gun is disabled by default
  // Enable this when you have a Gun server running
  const GUN_ENABLED = false
  
  if (GUN_ENABLED) {
    console.log('[Gun] Initializing Gun instance...')
    gunInstance = Gun({
      peers: ['https://gun-messaging-peer.herokuapp.com/gun'],
      localStorage: false,
      radisk: false,
    })
    console.log('[Gun] Gun initialized successfully')
  } else {
    console.log('[Gun] Gun is disabled (not configured)')
    // Create a dummy Gun instance that doesn't do anything
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
  }
} catch (err) {
  console.error('[Gun] Initialization failed:', err)
  // Create a dummy Gun instance that doesn't do anything
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
}

// Export a function to get the Gun instance
export const useGun = () => {
  return gunInstance
}

// Nuxt plugin export
export default defineNuxtPlugin(() => {
  console.log('[Gun] Plugin loaded')
  
  if (process.client) {
    window.$gun = gunInstance
  }

  return {
    provide: {
      gun: gunInstance,
    },
  }
})


