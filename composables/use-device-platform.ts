import { computed } from 'vue'
import { Capacitor } from '@capacitor/core'

export type DevicePlatform = 'android' | 'ios' | 'electron' | 'web'

/**
 * Runtime platform flags for the shared web/native build.
 * Capacitor reports `web` in the browser and for SSR, so the web experience is
 * unchanged unless the app is running inside a native shell.
 */
export const useDevicePlatform = () => {
  const platform = computed<DevicePlatform>(() => {
    const detected = Capacitor.getPlatform()
    if (detected === 'android' || detected === 'ios' || detected === 'electron') return detected
    return 'web'
  })

  const isNative = computed(() => platform.value === 'android' || platform.value === 'ios')
  const isAndroid = computed(() => platform.value === 'android')
  const isIos = computed(() => platform.value === 'ios')
  const isElectron = computed(() => platform.value === 'electron')
  const isWeb = computed(() => platform.value === 'web')

  const isPluginAvailable = (name: string) => Capacitor.isPluginAvailable(name)

  return { platform, isNative, isAndroid, isIos, isElectron, isWeb, isPluginAvailable }
}
