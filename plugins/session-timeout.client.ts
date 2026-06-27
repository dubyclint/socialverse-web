// ============================================================================
// FILE: /plugins/session-timeout.client.ts
// Description: Automated inactivity tracking and session destruction layer.
// ============================================================================
import { defineNuxtPlugin, useRouter } from '#app'
import { watch } from 'vue'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin({
  name: 'socialverse-session-timeout',

  // ✅ FIX: Force the core auth client engine to load first before listening to session limits
  dependsOn: ['socialverse-auth-client'],

  setup() {
    if (!process.client) return

    const authStore = useAuthStore()
    const router = useRouter()
    
    // Session timeout constants
    const SESSION_TIMEOUT = 15 * 60 * 1000 // 15 minutes
    const WARNING_TIME = 14 * 60 * 1000    // Show warning at 14 minutes
    
    let inactivityTimer: any = null
    let warningTimer: any = null
    let lastActivityTime = Date.now()
    
    const resetInactivityTimer = () => {
      lastActivityTime = Date.now()
      
      // Clear existing active timeout timers
      if (inactivityTimer) clearTimeout(inactivityTimer)
      if (warningTimer) clearTimeout(warningTimer)
      
      // Enforce operational boundaries only if user is logged in
      if (!authStore.isAuthenticated) return
      
      // Warning timer execution branch
      warningTimer = setTimeout(() => {
        console.log('[Session Timeout] Warning: Active window session expiring soon')
        window.dispatchEvent(new CustomEvent('session-warning'))
      }, WARNING_TIME)
      
      // Explicit drop and logout timer execution branch
      inactivityTimer = setTimeout(async () => {
        console.log('[Session Timeout] Active token session expired due to user inactivity')
        
        // Destruct localized state cache
        if (typeof authStore.logout === 'function') {
          authStore.logout()
        } else {
          authStore.clearAuth()
        }
        
        // Purge residual explicit window persistence trackers
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_user_id')
        localStorage.removeItem('refresh_token')
        sessionStorage.clear()
        
        // Redirect route gateway clean drop target matching route structure
        await router.push('/auth/login')
        
        // Disseminate event for notifications/modals layer to catch
        window.dispatchEvent(new CustomEvent('session-expired'))
      }, SESSION_TIMEOUT)
    }
    
    const clearInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      if (warningTimer) clearTimeout(warningTimer)
      inactivityTimer = null
      warningTimer = null
    }
    
    // Attach event hooks across dominant user input methods
    const setupActivityListeners = () => {
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
      
      const handleActivity = () => {
        if (authStore.isAuthenticated) {
          resetInactivityTimer()
        }
      }
      
      events.forEach(event => {
        window.addEventListener(event, handleActivity, { passive: true })
      })
      
      // Boot primary timer loop sequence if initial payload reports authentic context
      if (authStore.isAuthenticated) {
        resetInactivityTimer()
      }
    }
    
    // Watch status mutations inside Auth state tree reactive variables
    watch(
      () => authStore.isAuthenticated,
      (isAuth) => {
        if (isAuth) {
          resetInactivityTimer()
        } else {
          clearInactivityTimer()
        }
      },
      { immediate: true }
    )
    
    // Bind listeners to current context window
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
