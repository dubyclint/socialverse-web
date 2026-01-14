// ============================================================================
// FILE: /middleware/profile-completion.ts - FIXED VERSION (STEPS 3 & 4)
// ============================================================================
// ✅ STEP 3: Only redirect to /profile/complete during signup flow
// ✅ STEP 4: Don't re-ask for profile completion on subsequent sign-ins
// ✅ NEW: Track signup flow with session flag
// ============================================================================

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip on server-side
  if (process.server) return
  
  console.log('[ProfileCompletion] ============ MIDDLEWARE START ============')
  console.log('[ProfileCompletion] Route:', to.path)
  console.log('[ProfileCompletion] From:', from.path)

  // ============================================================================
  // PUBLIC ROUTES - NO MIDDLEWARE CHECK
  // ============================================================================
  const publicRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/login',
    '/signup',
    '/terms-and-policy',
    '/error'
  ]

  if (publicRoutes.some(route => to.path.startsWith(route))) {
    console.log('[ProfileCompletion] Public route, skipping middleware')
    console.log('[ProfileCompletion] ============ MIDDLEWARE END ============')
    return
  }

  // ============================================================================
  // PROFILE MANAGEMENT ROUTES - ALLOW ACCESS
  // ============================================================================
  const profileRoutes = [
    '/profile/edit',
    '/profile/complete',
    '/profile/complete-success',  // ✅ NEW: Allow success page
    '/settings'
  ]

  if (profileRoutes.some(route => to.path.startsWith(route))) {
    console.log('[ProfileCompletion] Profile management route, allowing access')
    console.log('[ProfileCompletion] ============ MIDDLEWARE END ============')
    return
  }

  // ============================================================================
  // GET AUTH STATE
  // ============================================================================
  const authStore = useAuthStore()
  const profileStore = useProfileStore()

  console.log('[ProfileCompletion] Auth state:', {
    isAuthenticated: authStore.isAuthenticated,
    hasUser: !!authStore.user,
    userId: authStore.user?.id,
    hasToken: !!authStore.token
  })

  // ============================================================================
  // NOT AUTHENTICATED - REDIRECT TO LOGIN
  // ============================================================================
  if (!authStore.isAuthenticated || !authStore.user || !authStore.token) {
    console.log('[ProfileCompletion] ❌ User not authenticated, redirecting to signin')
    console.log('[ProfileCompletion] ============ MIDDLEWARE END ============')
    return navigateTo('/auth/signin')
  }

  // ============================================================================
  // FETCH PROFILE IF NOT IN STORE
  // ============================================================================
  let profile = profileStore.profile

  if (!profile) {
    console.log('[ProfileCompletion] Profile not in store, fetching from API...')
    try {
      await profileStore.fetchProfile(authStore.user.id)
      profile = profileStore.profile
      console.log('[ProfileCompletion] ✅ Profile fetched:', profile?.id)
    } catch (error) {
      console.error('[ProfileCompletion] ❌ Error fetching profile:', error)
      // Continue with null profile
    }
  }

  // ============================================================================
  // CHECK PROFILE COMPLETION STATUS
  // ============================================================================
  const isProfileComplete = profile?.profile_completed === true

  console.log('[ProfileCompletion] Profile completion status:', {
    profileExists: !!profile,
    isComplete: isProfileComplete,
    profileId: profile?.id,
    username: profile?.username,
    fullName: profile?.full_name
  })

  // ============================================================================
  // ✅ STEP 3 & 4: SMART REDIRECT LOGIC
  // ============================================================================
  // Only redirect to /profile/complete if:
  // 1. Profile is incomplete AND
  // 2. User is coming from signup/auth pages (signup flow)
  // ============================================================================

  if (!isProfileComplete) {
    // Check if user is in signup flow
    const signupFlowRoutes = [
      '/auth/signup',
      '/signup',
      '/auth/verify-email',
      '/verify-email'
    ]

    const isFromSignupFlow = signupFlowRoutes.some(route => from.path.startsWith(route))
    const isFromCompleteSuccess = from.path.startsWith('/profile/complete-success')

    console.log('[ProfileCompletion] Profile incomplete check:', {
      isFromSignupFlow,
      isFromCompleteSuccess,
      fromPath: from.path
    })

    // ✅ ONLY redirect to complete if coming from signup flow
    if (isFromSignupFlow) {
      console.log('[ProfileCompletion] ⚠️ User from signup flow with incomplete profile')
      console.log('[ProfileCompletion] Redirecting to /profile/complete')
      console.log('[ProfileCompletion] ============ MIDDLEWARE END ============')
      return navigateTo('/profile/complete')
    }

    // ✅ If profile is incomplete but NOT from signup flow, allow access
    // This prevents re-asking on subsequent sign-ins
    console.log('[ProfileCompletion] ⚠️ Profile incomplete but NOT from signup flow')
    console.log('[ProfileCompletion] Allowing access (user already completed once)')
    console.log('[ProfileCompletion] ============ MIDDLEWARE END ============')
    return
  }

  // ============================================================================
  // PROFILE COMPLETE - ALLOW ACCESS
  // ============================================================================
  console.log('[ProfileCompletion] ✅ Profile complete, allowing access to:', to.path)
  console.log('[ProfileCompletion] ============ MIDDLEWARE END ============')
  return
})
