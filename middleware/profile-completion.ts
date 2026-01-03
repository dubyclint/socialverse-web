// FILE: /middleware/profile-completion.ts - PROFILE COMPLETION MIDDLEWARE (FIXED)
// ============================================================================
// Purpose: Redirect users with incomplete profiles to complete-profile page
// ============================================================================

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip on server-side
  if (process.server) return

  // ✅ FIX: Skip middleware on ALL auth routes (including signup)
  const authRoutes = [
    '/auth',
    '/auth/signin',
    '/auth/login',
    '/auth/signup',
    '/auth/verify-email',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/complete-profile'
  ]

  if (authRoutes.some(route => to.path.startsWith(route))) {
    console.log(`[Profile Completion] Skipping auth route: ${to.path}`)
    return
  }

  // Get user from auth store
  const authStore = useAuthStore()
  const user = authStore.user

  // If not authenticated, skip this middleware
  if (!user) {
    console.log(`[Profile Completion] No user, skipping middleware`)
    return
  }

  // Check if profile is completed
  const profileCompleted = user.user_metadata?.profile_completed || false

  console.log(`[Profile Completion] Profile completed: ${profileCompleted}`)

  // If profile is not completed and user is trying to access protected routes
  if (!profileCompleted) {
    // Allow access to certain pages
    const allowedRoutes = [
      '/settings',
      '/profile',
      '/auth/complete-profile'
    ]

    const isAllowed = allowedRoutes.some(route => to.path.startsWith(route))

    if (!isAllowed) {
      console.log(`[Profile Completion] Redirecting to complete-profile from ${to.path}`)
      return navigateTo('/auth/complete-profile')
    }
  }
})
