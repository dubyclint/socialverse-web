// ============================================================================
// FILE: /middleware/profile-completion.ts - PROFILE GATEKEEPER
// ============================================================================

export default defineNuxtRouteMiddleware(async (to) => {
  // 1. Safety Guard for undefined route
  if (!to || !to.path) return

  const path = to.path.replace(/\/$/, '') || '/'

  // 2. Skip if it's a public route
  const publicRoutes = [
    '/', '/signin', '/signup', '/auth/forgot-password', 
    '/auth/reset-password', '/auth/verify-email', 
    '/terms-and-policy', '/privacy-policy', '/error'
  ]
  const startsWithSegment = (p: string, prefix: string) => 
    p === prefix || p.startsWith(`${prefix}/`)
  
  if (publicRoutes.some((r) => startsWithSegment(path, r))) return

  const profileStore = useProfileStore()
  const tokenCookie = useCookie('auth_token')

  // 3. Auth Guard
  if (!tokenCookie.value) {
    return navigateTo('/signin', { replace: true })
  }

  // 4. Redirect Logic (Non-blocking)
  const onCompletePage = startsWithSegment(path, '/profile/complete')
  const onCompleteSuccessPage = startsWithSegment(path, '/profile/complete-success')

  // Rely on existing store state. Do not trigger blocking API calls.
  const profile = profileStore.profile
  const isComplete = profile?.profile_completed === true

  // If user is missing profile data (or explicitly marked incomplete)
  // We force them to the completion flow.
  if (!profile || !isComplete) {
    if (!onCompletePage && !onCompleteSuccessPage) {
      return navigateTo('/profile/complete', { replace: true })
    }
    return
  }

  // 5. If already complete, prevent access to the completion flow
  if (onCompletePage || onCompleteSuccessPage) {
    return navigateTo('/feed', { replace: true })
  }
})
