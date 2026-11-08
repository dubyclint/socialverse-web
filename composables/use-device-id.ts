const KEY = 'viorp:device-id'

/** Stable per-install id used to list and restrict signed-in devices. */
export const getDeviceId = (): string => {
  if (!import.meta.client) return ''
  let id = window.localStorage.getItem(KEY)
  if (!id) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
    window.localStorage.setItem(KEY, id)
  }
  return id
}
