import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { PushNotifications } from '@capacitor/push-notifications'

export type HapticStrength = 'light' | 'medium' | 'heavy'

const isNative = () => Capacitor.isNativePlatform()

/**
 * Single entry point for device capabilities. Every call falls back to the
 * equivalent browser API on web so pages behave identically in both targets.
 */
export const useNativeBridge = () => {
  const storage = {
    async get(key: string): Promise<string | null> {
      if (isNative()) return (await Preferences.get({ key })).value
      if (typeof localStorage === 'undefined') return null
      return localStorage.getItem(key)
    },
    async set(key: string, value: string): Promise<void> {
      if (isNative()) {
        await Preferences.set({ key, value })
        return
      }
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value)
    },
    async remove(key: string): Promise<void> {
      if (isNative()) {
        await Preferences.remove({ key })
        return
      }
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key)
    }
  }

  /** Returns a File the existing upload pipeline can consume, on both targets. */
  const pickImage = async (source: 'camera' | 'library' = 'library'): Promise<File | null> => {
    if (isNative()) {
      const photo = await Camera.getPhoto({
        quality: 85,
        resultType: CameraResultType.Uri,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos
      })
      if (!photo.webPath) return null
      const blob = await (await fetch(photo.webPath)).blob()
      return new File([blob], `capture.${photo.format || 'jpg'}`, { type: blob.type || 'image/jpeg' })
    }

    return new Promise<File | null>((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      if (source === 'camera') input.capture = 'environment'
      input.onchange = () => resolve(input.files?.[0] ?? null)
      input.oncancel = () => resolve(null)
      input.click()
    })
  }

  const haptic = async (strength: HapticStrength = 'light'): Promise<void> => {
    if (isNative()) {
      const style =
        strength === 'heavy' ? ImpactStyle.Heavy : strength === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light
      await Haptics.impact({ style })
      return
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(strength === 'heavy' ? 30 : strength === 'medium' ? 20 : 10)
    }
  }

  /**
   * Requests notification permission. On native this also registers for a push
   * token, which is delivered through the `registration` listener.
   */
  const requestNotificationPermission = async (): Promise<boolean> => {
    if (isNative()) {
      const status = await PushNotifications.requestPermissions()
      if (status.receive !== 'granted') return false
      await PushNotifications.register()
      return true
    }
    if (typeof Notification === 'undefined') return false
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  const onPushToken = (handler: (token: string) => void) => {
    if (!isNative()) return
    PushNotifications.addListener('registration', ({ value }) => handler(value))
  }

  return { storage, pickImage, haptic, requestNotificationPermission, onPushToken }
}
