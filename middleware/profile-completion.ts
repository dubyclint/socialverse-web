// ============================================================================
// FILE: /middleware/profile-completion.ts - PROFILE GATEKEEPER
// ============================================================================

export default defineNuxtRouteMiddleware(async (to) => {
  const path = to.path.replace(/\/$/, '') || '/'

  // 1. Skip if it's a public route
  const publicRoutes = ['/', '/signin', '/signup', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email', '/terms-and-policy', '/privacy-policy', '/error']
  const startsWithSegment = (p: string, prefix: string) => p === prefix || p.startsWith(`${prefix}/`)
  if (publicRoutes.some((r) => startsWithSegment(path, r))) return

  const profileStore = useProfileStore()
  const tokenCookie = useCookie('auth_token')

  // 2. Auth Guard (Fail-safe)
  if (!tokenCookie.value) {
    return navigateTo('/signin', { replace: true })
  }

  // 3. Profile Completion Check
  const onCompletePage = startsWithSegment(path, '/profile/complete')
  const onCompleteSuccessPage = startsWithSegment(path, '/profile/complete-success')

  // Ensure we have the profile (Works on Server and Client)
  // Ensure profileStore.fetchProfile() is SSR-safe (passes Authorization header)
  let profile = profileStore.profile
  if (!profile) {
    try {
      await profileStore.fetchProfile()
      profile = profileStore.profile
    } catch (err: any) {
      // If we can't fetch profile, assume it's missing or handle error
      profile = null
    }
  }

  const isComplete = profile?.profile_completed === true

  // 4. Redirect Logic
  if (!isComplete) {
    // If not complete and not on the completion pages, lock them in
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
