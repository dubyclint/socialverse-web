import { useProfileStore } from '~/stores/profile'
import type { Profile } from '~/types/profile'

type ProfileCallback = (profile: Profile) => void

const EVENT_NAME = 'profileUpdated'

const unwrap = <T>(res: any): T => (res?.data ?? res) as T

export const useProfileSync = () => {
  const profileStore = useProfileStore()

  // userId -> set of callbacks
  const callbackMap = new Map<string, Set<ProfileCallback>>()
  // callback -> event handler (for precise removeEventListener)
  const handlerMap = new WeakMap<ProfileCallback, EventListener>()

  const subscribeToProfileUpdates = (userId: string, callback: ProfileCallback) => {
    if (!process.client) return () => {}

    if (!callbackMap.has(userId)) callbackMap.set(userId, new Set())
    callbackMap.get(userId)!.add(callback)

    const handler: EventListener = (event: Event) => {
      const custom = event as CustomEvent<Profile>
      const incoming = custom.detail
      if (!incoming) return

      const incomingId = String(incoming.user_id || incoming.id || '')
      if (incomingId && incomingId === String(userId)) {
        callback(incoming)
      }
    }

    handlerMap.set(callback, handler)
    window.addEventListener(EVENT_NAME, handler)

    // return per-callback unsubscribe
    return () => {
      const set = callbackMap.get(userId)
      if (set) {
        set.delete(callback)
        if (set.size === 0) callbackMap.delete(userId)
      }

      const bound = handlerMap.get(callback)
      if (bound) {
        window.removeEventListener(EVENT_NAME, bound)
        handlerMap.delete(callback)
      }
    }
  }

  const unsubscribeFromProfileUpdates = (userId?: string) => {
    if (!process.client) return

    if (userId) {
      const set = callbackMap.get(userId)
      if (!set) return

      for (const cb of set) {
        const handler = handlerMap.get(cb)
        if (handler) {
          window.removeEventListener(EVENT_NAME, handler)
          handlerMap.delete(cb)
        }
      }
      callbackMap.delete(userId)
      return
    }

    // unsubscribe all
    for (const [, set] of callbackMap.entries()) {
      for (const cb of set) {
        const handler = handlerMap.get(cb)
        if (handler) {
          window.removeEventListener(EVENT_NAME, handler)
          handlerMap.delete(cb)
        }
      }
    }
    callbackMap.clear()
  }

  const broadcastProfileUpdate = (profile: Profile) => {
    if (!process.client || !profile) return

    // update central store too (single source of truth)
    profileStore.setProfile(profile)

    window.dispatchEvent(
      new CustomEvent<Profile>(EVENT_NAME, {
        detail: profile,
        bubbles: false,
        composed: false
      })
    )
  }

  const syncProfileFromAPI = async (userId: string) => {
    try {
      const res = await $fetch(`/api/profile/${encodeURIComponent(userId)}`)
      const profile = unwrap<Profile>(res)
      if (!profile) return null

      broadcastProfileUpdate(profile)
      return profile
    } catch (error) {
      console.error('[useProfileSync] syncProfileFromAPI error:', error)
      return null
    }
  }

  return {
    subscribeToProfileUpdates,
    unsubscribeFromProfileUpdates,
    broadcastProfileUpdate,
    syncProfileFromAPI
  }
}
