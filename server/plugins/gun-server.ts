// ============================================================================
// server/plugins/gun-server.ts - GUN DATABASE SERVER PLUGIN (DISABLED)
// ============================================================================
// ✅ TEMPORARY FIX: GUN disabled to prevent "Cannot set property state" error

import type { NitroApp } from 'nitropack'

export default defineNitroPlugin((nitroApp: NitroApp) => {
  console.log('[Gun Server] GUN DISABLED - causes History error during build')
  
  // ✅ Return safe mock
  const gunMock = {
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

  (globalThis as any).gun = gunMock
})
