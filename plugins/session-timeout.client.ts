// ============================================================================
// FILE: /plugins/session-timeout.client.ts
// Signs the user out after 8 hours without activity. The last-activity stamp
// is persisted so idle time keeps counting while the tab is closed.
// ============================================================================
import { defineNuxtPlugin, useRouter } from '#app'
import { watch } from 'vue'
import { useSupabaseUser, useSupabaseClient } from '#imports'

const SESSION_TIMEOUT = 8 * 60 * 60 * 1000
const WARNING_BEFORE = 5 * 60 * 1000
const ACTIVITY_KEY = 'socialverse:last-activity'

export default defineNuxtPlugin({
  name: 'socialverse-session-timeout',

  setup() {
    if (!import.meta.client) return

    const user = useSupabaseUser()
    const router = useRouter()

    let inactivityTimer: ReturnType<typeof setTimeout> | null = null
    let warningTimer: ReturnType<typeof setTimeout> | null = null

    const readLastActivity = (): number => {
      const stored = Number(window.localStorage.getItem(ACTIVITY_KEY))
      return Number.isFinite(stored) && stored > 0 ? stored : Date.now()
    }

    const expire = async () => {
      window.localStorage.removeItem(ACTIVITY_KEY)
      const client = useSupabaseClient()
      await client.auth.signOut()
      await router.push('/signin')
      window.dispatchEvent(new CustomEvent('session-expired'))
    }

    const clearInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      if (warningTimer) clearTimeout(warningTimer)
      inactivityTimer = null
      warningTimer = null
    }

    /** Schedules against the persisted stamp so a reopened tab resumes the clock. */
    const scheduleFromStamp = () => {
      clearInactivityTimer()
      if (!user.value) return

      const idleFor = Date.now() - readLastActivity()
      const remaining = SESSION_TIMEOUT - idleFor

      if (remaining <= 0) {
        void expire()
        return
      }

      if (remaining > WARNING_BEFORE) {
        warningTimer = setTimeout(
          () => window.dispatchEvent(new CustomEvent('session-warning')),
          remaining - WARNING_BEFORE
        )
      }

      inactivityTimer = setTimeout(() => void expire(), remaining)
    }

    const resetInactivityTimer = () => {
      if (!user.value) {
        clearInactivityTimer()
        return
      }
      window.localStorage.setItem(ACTIVITY_KEY, String(Date.now()))
      scheduleFromStamp()
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    const handleActivity = () => {
      if (user.value) resetInactivityTimer()
    }
    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }))

    // A tab that was hidden for hours must not be treated as active on return.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) scheduleFromStamp()
    })

    watch(
      () => user.value,
      (signedIn) => {
        if (!signedIn) {
          window.localStorage.removeItem(ACTIVITY_KEY)
          clearInactivityTimer()
          return
        }
        // Resume an existing idle window rather than restarting it on reload.
        if (!window.localStorage.getItem(ACTIVITY_KEY)) {
          window.localStorage.setItem(ACTIVITY_KEY, String(Date.now()))
        }
        scheduleFromStamp()
      },
      { immediate: true }
    )

    return {
      provide: {
        sessionTimeout: {
          resetTimer: resetInactivityTimer,
          clearTimer: clearInactivityTimer
        }
      }
    }
  }
})
