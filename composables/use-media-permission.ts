import { Capacitor, registerPlugin } from '@capacitor/core'

type NativeState = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'
type Kind = 'camera' | 'microphone'
interface DevicePermissionsPlugin {
  checkPermissions: () => Promise<Record<Kind, NativeState>>
  requestPermissions: (options: { permissions: Kind[] }) => Promise<Record<Kind, NativeState>>
  openSettings: () => Promise<void>
}

const DevicePermissions = registerPlugin<DevicePermissionsPlugin>('DevicePermissions')

/** granted: ready · prompt: the system dialog can still be shown · blocked: only Settings can fix it. */
export type MediaAccess = 'granted' | 'prompt' | 'blocked' | 'unknown'

const kindsFor = (video: boolean): Kind[] => video ? ['camera', 'microphone'] : ['microphone']

const summarize = (states: Partial<Record<Kind, string>>, kinds: Kind[]): MediaAccess => {
  if (kinds.every(k => states[k] === 'granted')) return 'granted'
  if (kinds.some(k => states[k] === 'denied')) return 'blocked'
  return 'prompt'
}

/** Standard allow-camera/microphone flow: check, ask with the system dialog, or send to Settings. */
export const useMediaPermission = () => {
  const native = Capacitor.isNativePlatform()

  const check = async (video = true): Promise<MediaAccess> => {
    const kinds = kindsFor(video)
    if (native) {
      try { return summarize(await DevicePermissions.checkPermissions(), kinds) } catch { return 'unknown' }
    }
    if (!navigator.permissions?.query) return 'unknown'
    try {
      const states = await Promise.all(kinds.map(k => navigator.permissions.query({ name: k as PermissionName }).then(s => s.state)))
      return summarize(Object.fromEntries(kinds.map((k, i) => [k, states[i]])), kinds)
    } catch {
      return 'unknown'
    }
  }

  /** Shows the system permission dialog. Call from a tap so browsers allow the prompt. */
  const request = async (video = true): Promise<MediaAccess> => {
    const kinds = kindsFor(video)
    if (native) {
      try { return summarize(await DevicePermissions.requestPermissions({ permissions: kinds }), kinds) } catch { /* app build without the plugin: the WebView asks instead */ }
    }
    if (!navigator.mediaDevices?.getUserMedia) return 'unknown'
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video })
      stream.getTracks().forEach(t => t.stop())
      return 'granted'
    } catch (e) {
      return (e as DOMException)?.name === 'NotAllowedError' ? 'blocked' : 'unknown'
    }
  }

  /** In the app, asks Android before the WebView does; a no-op on the web, where getUserMedia prompts. */
  const prepare = async (video = true): Promise<MediaAccess> => native ? request(video) : 'unknown'

  const openSettings = async (): Promise<boolean> => {
    if (!native) return false
    try { await DevicePermissions.openSettings(); return true } catch { return false }
  }

  return { native, check, request, prepare, openSettings }
}
