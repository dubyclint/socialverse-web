// ============================================================================
// FILE: /plugins/session-timeout.client.ts
// ============================================================================
import { defineNuxtPlugin, useRouter } from '#app'
import { watch } from 'vue'
import { useSupabaseUser } from '#imports'

export default defineNuxtPlugin({
  name: 'socialverse-session-timeout',

  setup() {
    if (!process.client) return

    const user = useSupabaseUser()
    const router = useRouter()
    
    const SESSION_TIMEOUT = 15 * 60 * 1000
    const WARNING_TIME = 14 * 60 * 1000
    
    let inactivityTimer: ReturnType<typeof setTimeout> | null = null
    let warningTimer: ReturnType<typeof setTimeout> | null = null
    
    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      if (warningTimer) clearTimeout(warningTimer)
      
      // Enforce operational boundaries using native session state
      if (!user.value) return
      
      warningTimer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('session-warning'))
      }, WARNING_TIME)
      
      inactivityTimer = setTimeout(async () => {
        const client = useSupabaseClient()
        await client.auth.signOut()
        
        await router.push('/signin')
        window.dispatchEvent(new CustomEvent('session-expired'))
      }, SESSION_TIMEOUT)
    }
    
    const clearInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      if (warningTimer) clearTimeout(warningTimer)
      inactivityTimer = null
      warningTimer = null
    }
    
    const setupActivityListeners = () => {
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
      const handleActivity = () => {
        if (user.value) resetInactivityTimer()
      }
      events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }))
      
      if (user.value) resetInactivityTimer()
    }
    
    watch(
      () => user.value,
      (isAuth) => {
        isAuth ? resetInactivityTimer() : clearInactivityTimer()
      },
      { immediate: true }
    )
    
    setupActivityListeners()
    
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
