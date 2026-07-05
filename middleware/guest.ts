// ============================================================================
// FILE: /middleware/guest.ts - STABLE GUEST GUARD
// ============================================================================
import { useUserStore } from '~/stores/user'

export default defineNuxtRouteMiddleware(async () => {
  const userStore = useUserStore()
  const tokenCookie = useCookie('auth_token')

  // 1. If no token exists, they are truly a guest. Allow access.
  if (!tokenCookie.value) {
    return
  }

  // 2. If a token exists, verify if the user session is active.
  try {
    // If the store is empty, try to fetch the profile to confirm session validity
    if (!userStore.user) {
      await userStore.fetchProfile()
    }

    // If we have a user, they are logged in. Redirect to feed.
    if (userStore.user) {
      return navigateTo('/feed', { replace: true })
    }
  } catch (error) {
    // If validation fails (token expired/invalid), wipe the state
    console.error('[Guest Middleware] Session check failed:', error)
    userStore.logout()
  }

  // If token was present but invalid/expired, let them proceed to the guest page
  // (the error catch block will have cleared the store/cookie)
})
