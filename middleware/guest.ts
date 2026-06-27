// ============================================================================
// FILE: /middleware/guest.ts - STABLE GUEST GUARD
// ============================================================================
// Behavior:
// - Allow guest pages for unauthenticated users
// - Redirect authenticated users away from guest pages to /feed
// - Do not create redirect loops during hydration
// ============================================================================

export default defineNuxtRouteMiddleware(async () => {
  if (process.server) return

  const authStore = useAuthStore()

  // Hydrate once
  if (!authStore.isHydrated) {
    if (typeof authStore.hydrateFromStorage === 'function') {
      await authStore.hydrateFromStorage()
    } else if (typeof authStore.initializeSession === 'function') {
      await authStore.initializeSession()
    }
  }

  // No token or no user id => guest allowed
  if (!authStore.token || !authStore.userId) {
    // Important: do not force clearAuth() repeatedly here
    // to avoid hydration-flip loops.
    return
  }

  // Has token+userId -> validate once via store (throttled)
  try {
    const isValid = await authStore.validateToken()
    if (isValid) {
      return navigateTo('/feed', { replace: true })
    }

    // invalid session -> clean up and allow guest page
    authStore.clearAuth()
    return
  } catch {
    authStore.clearAuth()
    return
  }
})
