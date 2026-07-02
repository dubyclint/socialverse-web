// ============================================================================
// FILE: /middleware/guest.ts - STABLE GUEST GUARD
// ============================================================================

export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()
  const tokenCookie = useCookie('auth_token')

  // 1. Check for token via the cookie (SSR-Safe)
  // If the user has a token, they have no business being on a guest/auth page.
  if (tokenCookie.value) {
    // Validate session if we have a token
    const isValid = await authStore.validateToken()
    if (isValid) {
      return navigateTo('/feed', { replace: true })
    }
  }

  // 2. Fallback to client-side cleanup
  // If the cookie is present but validation fails, ensure the store is clean
  if (import.meta.client && !tokenCookie.value) {
     // Optional: If you still need to ensure client-side state is wiped
     if (authStore.isAuthenticated) authStore.clearAuth()
  }

  return
})
