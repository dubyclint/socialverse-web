// ============================================================================
// use-gun.ts - GUN DATABASE COMPOSABLE (DISABLED)
// ============================================================================
// ✅ TEMPORARY FIX: GUN disabled to prevent "Cannot set property state" error

interface GunInstance {
  get: (key: string) => any
  put: (data: any) => any
  on: (callback: (data: any) => void) => any
  off: () => void
}

// ✅ Safe mock Gun instance
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

const gun: GunInstance = createSafeGunInstance()

export default gun

export const useGun = () => {
  const nuxtApp = useNuxtApp()
  
  return {
    gun: nuxtApp.$gun || gun,
    initializeGun: nuxtApp.$initializeGun || (() => null),
    disconnectGun: nuxtApp.$disconnectGun || (() => {}),
  }
}
