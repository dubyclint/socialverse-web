// ============================================================================
// FILE: /composables/use-gun.ts
// Description: GunDB real-time storage hook wrapper with runtime mock protection overrides.
// ============================================================================
import { useNuxtApp } from '#app'

interface GunInstance {
  get: (key: string) => any
  put: (data: any) => any
  on: (callback: (data: any) => void) => any
  off: () => void
}

// ✅ Safe dynamic mock schema container if plugin instance is absent
const createSafeGunInstance = (): GunInstance => {
  return {
    get: (_key: string) => ({
      on: (_callback: Function) => {},
      once: (_callback: Function) => {},
      put: (_data: any) => ({ on: () => {}, once: () => {} }),
    }),
    put: (_data: any) => ({
      on: (_callback: Function) => {},
      once: (_callback: Function) => {},
    }),
    on: (_callback: Function) => {},
    off: () => {},
  }
}

const fallbackGunInstance: GunInstance = createSafeGunInstance()

export default fallbackGunInstance

export const useGun = () => {
  // ✅ FIXED: Safely calling application context with correct types
  const nuxtApp = useNuxtApp()
  
  // Extract contextual targets safely out of app space
  const gun = (nuxtApp.$gun as any) || fallbackGunInstance
  const initializeGun = (nuxtApp.$initializeGun as any) || (() => null)
  const disconnectGun = (nuxtApp.$disconnectGun as any) || (() => {})
  
  return {
    gun,
    initializeGun,
    disconnectGun,
  }
}
