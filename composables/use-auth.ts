// ============================================================================
// ENHANCED LOGOUT METHOD FOR /composables/use-auth.ts
// ============================================================================
// ENHANCEMENTS:
// ✅ Add profile store clearing
// ✅ Add other store clearing (notifications, messages, etc.)
// ✅ Add complete localStorage clearing
// ✅ Add sessionStorage clearing
// ✅ Add comprehensive logging
// ============================================================================

// REPLACE THE EXISTING logout METHOD WITH THIS:

const logout = async () => {
  loading.value = true
  error.value = null

  try {
    console.log('[useAuth] ============ LOGOUT START ============')
    console.log('[useAuth] Logout attempt')

    // ============================================================================
    // CALL LOGOUT API
    // ============================================================================
    console.log('[useAuth] Calling logout API...')
    
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST'
      })
      console.log('[useAuth] ✅ Logout API call successful')
    } catch (apiError: any) {
      console.warn('[useAuth] ⚠️ Logout API error:', apiError.message)
      // Continue anyway - we'll still clear client-side data
    }

    // ============================================================================
    // CLEAR AUTH STORE
    // ============================================================================
    console.log('[useAuth] Clearing auth store...')
    authStore.clearAuth()
    console.log('[useAuth] ✅ Auth store cleared')

    // ============================================================================
    // CLEAR PROFILE STORE
    // ============================================================================
    console.log('[useAuth] Clearing profile store...')
    try {
      const profileStore = useProfileStore()
      profileStore.clearProfile()
      console.log('[useAuth] ✅ Profile store cleared')
    } catch (profileError: any) {
      console.warn('[useAuth] ⚠️ Profile store clearing error:', profileError.message)
    }

    // ============================================================================
    // CLEAR OTHER STORES (if they exist)
    // ============================================================================
    console.log('[useAuth] Clearing other stores...')
    
    try {
      // Clear notifications store
      const notificationsStore = useNotificationsStore?.()
      if (notificationsStore && typeof notificationsStore.clearNotifications === 'function') {
        notificationsStore.clearNotifications()
        console.log('[useAuth] ✅ Notifications store cleared')
      }
    } catch (err) {
      console.warn('[useAuth] ⚠️ Notifications store not available')
    }

    try {
      // Clear messages store
      const messagesStore = useMessagesStore?.()
      if (messagesStore && typeof messagesStore.clearMessages === 'function') {
        messagesStore.clearMessages()
        console.log('[useAuth] ✅ Messages store cleared')
      }
    } catch (err) {
      console.warn('[useAuth] ⚠️ Messages store not available')
    }

    try {
      // Clear chat store
      const chatStore = useChatStore?.()
      if (chatStore && typeof chatStore.clearChat === 'function') {
        chatStore.clearChat()
        console.log('[useAuth] ✅ Chat store cleared')
      }
    } catch (err) {
      console.warn('[useAuth] ⚠️ Chat store not available')
    }

    try {
      // Clear user store
      const userStore = useUserStore?.()
      if (userStore && typeof userStore.clearUser === 'function') {
        userStore.clearUser()
        console.log('[useAuth] ✅ User store cleared')
      }
    } catch (err) {
      console.warn('[useAuth] ⚠️ User store not available')
    }

    // ============================================================================
    // CLEAR ALL LOCALSTORAGE DATA
    // ============================================================================
    console.log('[useAuth] Clearing all localStorage data...')
    
    if (process.client) {
      try {
        // Get all localStorage keys
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key) {
            keysToRemove.push(key)
          }
        }

        console.log('[useAuth] Found', keysToRemove.length, 'localStorage keys to remove')

        // Remove all keys
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key)
            console.log('[useAuth] ✅ Removed localStorage key:', key)
          } catch (err) {
            console.warn('[useAuth] ⚠️ Failed to remove localStorage key:', key)
          }
        })

        console.log('[useAuth] ✅ All localStorage data cleared')
      } catch (storageError: any) {
        console.error('[useAuth] ❌ localStorage clearing error:', storageError.message)
      }
    }

    // ============================================================================
    // CLEAR ALL SESSIONSTORAGE DATA
    // ============================================================================
    console.log('[useAuth] Clearing all sessionStorage data...')
    
    if (process.client) {
      try {
        // Get all sessionStorage keys
        const keysToRemove = []
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (key) {
            keysToRemove.push(key)
          }
        }

        console.log('[useAuth] Found', keysToRemove.length, 'sessionStorage keys to remove')

        // Remove all keys
        keysToRemove.forEach(key => {
          try {
            sessionStorage.removeItem(key)
            console.log('[useAuth] ✅ Removed sessionStorage key:', key)
          } catch (err) {
            console.warn('[useAuth] ⚠️ Failed to remove sessionStorage key:', key)
          }
        })

        console.log('[useAuth] ✅ All sessionStorage data cleared')
      } catch (storageError: any) {
        console.error('[useAuth] ❌ sessionStorage clearing error:', storageError.message)
      }
    }

    // ============================================================================
    // CLEAR COOKIES (if needed)
    // ============================================================================
    console.log('[useAuth] Clearing auth cookies...')
    
    try {
      // Clear auth token cookie
      useCookie('auth_token').value = null
      console.log('[useAuth] ✅ Auth token cookie cleared')

      // Clear refresh token cookie
      useCookie('auth_refresh_token').value = null
      console.log('[useAuth] ✅ Refresh token cookie cleared')

      // Clear user cookie
      useCookie('auth_user').value = null
      console.log('[useAuth] ✅ User cookie cleared')
    } catch (cookieError: any) {
      console.warn('[useAuth] ⚠️ Cookie clearing error:', cookieError.message)
    }

    // ============================================================================
    // REDIRECT TO LOGIN
    // ============================================================================
    console.log('[useAuth] Redirecting to login page...')
    
    try {
      await navigateTo('/login')
      console.log('[useAuth] ✅ Redirected to login')
    } catch (navError: any) {
      console.warn('[useAuth] ⚠️ Navigation error:', navError.message)
      // Fallback: reload page
      if (process.client) {
        window.location.href = '/login'
      }
    }

    console.log('[useAuth] ✅ Logout completed successfully')
    console.log('[useAuth] ============ LOGOUT END ============')

    return {
      success: true,
      message: 'Logged out successfully'
    }

  } catch (err: any) {
    console.error('[useAuth] ============ LOGOUT ERROR ============')
    console.error('[useAuth] Error type:', err.constructor.name)
    console.error('[useAuth] Error message:', err.message)
    console.error('[useAuth] Error stack:', err.stack)
    console.error('[useAuth] ============ END ERROR ============')

    // Clear auth anyway even if error occurs
    console.log('[useAuth] Clearing auth store despite error...')
    try {
      authStore.clearAuth()
      console.log('[useAuth] ✅ Auth store cleared despite error')
    } catch (clearError) {
      console.error('[useAuth] ❌ Failed to clear auth store:', clearError)
    }

    // Try to redirect to login anyway
    try {
      await navigateTo('/login')
    } catch (navError) {
      if (process.client) {
        window.location.href = '/login'
      }
    }

    return {
      success: true,
      message: 'Logged out'
    }
  } finally {
    loading.value = false
  }
}

// ============================================================================
// HELPER FUNCTION: Safe store access
// ============================================================================
// These helper functions safely access stores that may not exist

function useNotificationsStore() {
  try {
    return useStore('notifications')
  } catch {
    return null
  }
}

function useMessagesStore() {
  try {
    return useStore('messages')
  } catch {
    return null
  }
}

function useChatStore() {
  try {
    return useStore('chat')
  } catch {
    return null
  }
}

function useUserStore() {
  try {
    return useStore('user')
  } catch {
    return null
  }
}

function useStore(storeName: string) {
  try {
    const { useStore: usePiniaStore } = await import('pinia')
    return usePiniaStore(storeName)
  } catch {
    return null
  }
}
