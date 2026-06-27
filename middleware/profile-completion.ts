export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return

  const path = to.path.replace(/\/$/, '') || '/'

  const publicRoutes = [
    '/',
    '/signin',
    '/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
    '/terms-and-policy',
    '/privacy-policy',
    '/error'
  ]

  const startsWithSegment = (p: string, prefix: string) =>
    p === prefix || p.startsWith(`${prefix}/`)

  const isPublic = publicRoutes.some((r) => startsWithSegment(path, r))
  if (isPublic) return

  const authStore = useAuthStore()
  const profileStore = useProfileStore()

  if (!authStore.isHydrated) {
    if (typeof authStore.initializeSession === 'function') {
      await authStore.initializeSession()
    } else if (typeof authStore.hydrateFromStorage === 'function') {
      await authStore.hydrateFromStorage()
    }
  }

  if (!authStore.token) {
    authStore.clearAuth?.()
    profileStore.clearProfile?.()
    ;(profileStore as any).needsProfileCompletion = false
    return navigateTo('/signin', { replace: true })
  }

  let resolvedUserId: string | null = null
  try {
    const me: any = await $fetch('/api/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${authStore.token}` }
    })

    resolvedUserId =
      me?.id ||
      me?.user_id ||
      me?.user?.id ||
      me?.data?.id ||
      me?.data?.user_id ||
      me?.data?.user?.id ||
      null
  } catch {
    resolvedUserId = null
  }

  if (!resolvedUserId) {
    authStore.clearAuth?.()
    profileStore.clearProfile?.()
    ;(profileStore as any).needsProfileCompletion = false
    return navigateTo('/signin', { replace: true })
  }

  const onCompletePage = startsWithSegment(path, '/profile/complete')
  const onCompleteSuccessPage = startsWithSegment(path, '/profile/complete-success')

  let profile = profileStore.profile
  let missingProfile = false

  if (!profile) {
    try {
      await profileStore.fetchProfile()
      profile = profileStore.profile
      missingProfile = !profile
    } catch (err: any) {
      const status = err?.statusCode || err?.status || err?.response?.status
      if (status === 404) {
        missingProfile = true
      } else {
        missingProfile = !profile
      }
    }
  }

  if (missingProfile) {
    ;(profileStore as any).needsProfileCompletion = true
    if (!onCompletePage && !onCompleteSuccessPage) {
      return navigateTo('/profile/complete', { replace: true })
    }
    return
  }

  ;(profileStore as any).needsProfileCompletion = false

  const isComplete = profile?.profile_completed === true

  if (!isComplete) {
    if (!onCompletePage && !onCompleteSuccessPage) {
      return navigateTo('/profile/complete', { replace: true })
    }
    return
  }

  if (onCompletePage || onCompleteSuccessPage) {
    return navigateTo('/feed', { replace: true })
  }

  return
})
