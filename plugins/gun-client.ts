// ============================================================================
// plugins/gun-client.ts - GUN DATABASE CLIENT PLUGIN (DISABLED)
// ============================================================================
// ✅ TEMPORARY FIX: GUN disabled to prevent "Cannot set property state" error
// This error occurs because GUN tries to manipulate the History object
// which is read-only in modern browsers during SSR/prerender

export default defineNuxtPlugin(() => {
  console.log('[Gun] Plugin loaded - GUN DISABLED (causes History error)')
  
  // ✅ Return safe mock that does nothing
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

  if (process.client) {
    window.$gun = gunMock
  }

  return {
    provide: {
      gun: gunMock,
      initializeGun: () => {
        console.warn('[Gun] GUN initialization disabled - use Supabase instead')
        return null
      },
      disconnectGun: () => {
        console.warn('[Gun] GUN disconnect disabled')
      }
    }
  }
})
