// ============================================================================
// FILE: /plugins/session-timeout.client.ts
// ============================================================================
import { defineNuxtPlugin, useRouter } from '#app'
import { watch } from 'vue'
import { useUserStore } from '~/stores/user' // Updated import

export default defineNuxtPlugin({
  name: 'socialverse-session-timeout',

  setup() {
    if (!process.client) return

    const userStore = useUserStore() // Using the unified store
    const router = useRouter()
    
    const SESSION_TIMEOUT = 15 * 60 * 1000
    const WARNING_TIME = 14 * 60 * 1000
    
    let inactivityTimer: any = null
    let warningTimer: any = null
    
    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      if (warningTimer) clearTimeout(warningTimer)
      
      // Enforce operational boundaries using unified store state
      if (!userStore.isAuthenticated) return
      
      warningTimer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('session-warning'))
      }, WARNING_TIME)
      
      inactivityTimer = setTimeout(async () => {
        // Unified logout cleans everything in the UserStore
        await userStore.logout()
        
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
        if (userStore.isAuthenticated) resetInactivityTimer()
      }
      events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }))
      
      if (userStore.isAuthenticated) resetInactivityTimer()
    }
    
    watch(
      () => userStore.isAuthenticated,
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
