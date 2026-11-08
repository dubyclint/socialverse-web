// Tells the server this device is signed in (Settings > Security > Devices) and
// signs out locally when the account's device rule does not allow this device.
import { defineNuxtPlugin, navigateTo } from '#app'
import { watch } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { getDeviceId } from '~/composables/use-device-id'

const INTERVAL = 5 * 60 * 1000

export default defineNuxtPlugin(() => {
  const user = useSupabaseUser()
  let timer: ReturnType<typeof setInterval> | null = null

  const beat = async () => {
    if (!user.value) return
    try {
      const res = await $fetch<{ blocked?: boolean }>('/api/security/devices/heartbeat', { method: 'POST', body: { device_id: getDeviceId() }, retry: 0 })
      if (res?.blocked) {
        await useSupabaseClient().auth.signOut({ scope: 'local' }).catch(() => undefined)
        await navigateTo('/signin?reason=device')
      }
    } catch {
      // offline or a transient error: try again on the next beat, never sign out here
    }
  }

  watch(() => user.value?.id, (id) => {
    if (timer) clearInterval(timer)
    timer = null
    if (id) {
      void beat()
      timer = setInterval(beat, INTERVAL)
    }
  }, { immediate: true })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void beat()
  })
})
