// FILE: /middleware/profile-completion.ts - CREATE
// Profile Completion Middleware
// ============================================================================

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip on server-side
  if (process.server) return

  // Skip middleware on auth routes
  const authRoutes = [
    '/auth',
    '/auth/signin',
    '/auth/login',
    '/auth/verify-email',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/complete-profile'
  ]

  if (authRoutes.some(route => to.path.startsWith(route))) {
    return
  }

  // Get user from auth store
  const authStore = useAuthStore()
  const user = authStore.user

  // If not authenticated, skip this middleware
  if (!user) {
    return
  }

  // Check if profile is completed
  const profileCompleted = user.profile?.profile_completed || false

  // If profile is not completed and user is trying to access protected routes
  if (!profileCompleted) {
    // Allow access to certain pages
    const allowedRoutes = [
      '/auth/complete-profile',
      '/settings',
      '/logout',
      '/auth/verify-email'
    ]

    const isAllowed = allowedRoutes.some(route => to.path.startsWith(route))

    if (!isAllowed) {
      return navigateTo('/auth/complete-profile')
    }
  }
})
