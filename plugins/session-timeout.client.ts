// plugins/session-timeout.client.ts
// Session timeout and auto-logout plugin

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  const router = useRouter()
  
  // Session timeout in milliseconds (15 minutes)
  const SESSION_TIMEOUT = 15 * 60 * 1000
  const WARNING_TIME = 14 * 60 * 1000 // Show warning at 14 minutes
  
  let inactivityTimer: NodeJS.Timeout | null = null
  let warningTimer: NodeJS.Timeout | null = null
  let lastActivityTime = Date.now()
  
  const resetInactivityTimer = () => {
    lastActivityTime = Date.now()
    
    // Clear existing timers
    if (inactivityTimer) clearTimeout(inactivityTimer)
    if (warningTimer) clearTimeout(warningTimer)
    
    // Only set timers if user is authenticated
    if (!authStore.isAuthenticated) return
    
    // Warning timer - show warning 1 minute before logout
    warningTimer = setTimeout(() => {
      console.log('[Session Timeout] Warning: Session expiring soon')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('session-warning'))
      }
    }, WARNING_TIME)
    
    // Logout timer
    inactivityTimer = setTimeout(async () => {
      console.log('[Session Timeout] Session expired due to inactivity')
      
      // Clear auth
      authStore.clearAuth()
      
      // Clear all auth-related localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_user_id')
        localStorage.removeItem('refresh_token')
        sessionStorage.clear()
      }
      
      // Redirect to signin
      await router.push('/auth/signin')
      
      // Show notification
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('session-expired'))
      }
    }, SESSION_TIMEOUT)
  }
  
  const clearInactivityTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer)
    if (warningTimer) clearTimeout(warningTimer)
    inactivityTimer = null
    warningTimer = null
  }
  
  // Track user activity
  const setupActivityListeners = () => {
    if (typeof window === 'undefined') return
    
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      // Only reset if user is authenticated
      if (authStore.isAuthenticated) {
        resetInactivityTimer()
      }
    }
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })
    
    // Initial timer setup
    if (authStore.isAuthenticated) {
      resetInactivityTimer()
    }
  }
  
  // Watch auth state changes
  watch(
    () => authStore.isAuthenticated,
    (isAuth) => {
      if (isAuth) {
        resetInactivityTimer()
      } else {
        clearInactivityTimer()
      }
    }
  )
  
  // Setup on mount
  if (typeof window !== 'undefined') {
    setupActivityListeners()
  }
  
  return {
    provide: {
      sessionTimeout: {
        resetTimer: resetInactivityTimer,
        clearTimer: clearInactivityTimer,
        getLastActivityTime: () => lastActivityTime
      }
    }
  }
})
