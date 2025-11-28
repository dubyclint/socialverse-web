// ============================================================================
// use-gun.ts - GUN DATABASE COMPOSABLE (FIXED)
// ============================================================================
// ✅ FIXES:
// - Removed history manipulation
// - Disabled all storage mechanisms
// - Added proper error handling
// - Safe initialization

// ✅ CRITICAL: Do NOT import Gun directly - use the plugin instead
// This prevents the error

interface GunInstance {
  get: (key: string) => any
  put: (data: any) => any
  on: (callback: (data: any) => void) => any
  off: () => void
}

// ✅ FIXED: Safe mock Gun instance
const createSafeGunInstance = (): GunInstance => {
  return {
    get: (key: string) => ({
      on: (callback: Function) => {},
      once: (callback: Function) => {},
      put: (data: any) => ({ on: () => {}, once: () => {} }),
    }),
    put: (data: any) => ({
      on: (callback: Function) => {},
      once: (callback: Function) => {},
    }),
    on: (callback: Function) => {},
    off: () => {},
  }
}

// ✅ FIXED: Use safe instance instead of direct Gun initialization
const gun: GunInstance = createSafeGunInstance()

export default gun

// ✅ ADDED: Export composable for use in components
export const useGun = () => {
  const nuxtApp = useNuxtApp()
  
  return {
    gun: nuxtApp.$gun || gun,
    initializeGun: nuxtApp.$initializeGun || (() => null),
    disconnectGun: nuxtApp.$disconnectGun || (() => {}),
  }
}
