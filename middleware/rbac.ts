// FILE: /middleware/rbac.ts - UPDATE
// Role-Based Access Control Middleware
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

  // If not authenticated, redirect to login
  if (!user) {
    return navigateTo('/auth/signin')
  }

  // Define role-based route access
  const roleBasedRoutes: { [key: string]: string[] } = {
    admin: ['/admin', '/admin-analytics', '/admin-escrow'],
    manager: ['/manager', '/manager-analytics'],
    user: ['/feed', '/profile', '/settings', '/inbox', '/my-pocket', '/explore']
  }

  // Get user role
  const userRole = user.role || 'user'

  // Check if user has access to the route
  const allowedRoutes = roleBasedRoutes[userRole] || roleBasedRoutes.user
  const hasAccess = allowedRoutes.some(route => to.path.startsWith(route))

  // If user doesn't have access to admin/manager routes, redirect to feed
  if (!hasAccess && (to.path.startsWith('/admin') || to.path.startsWith('/manager'))) {
    return navigateTo('/feed')
  }

  // Check profile completion status
  if (!user.profile?.profile_completed && !to.path.startsWith('/auth/complete-profile')) {
    // Allow access to certain pages even if profile is not completed
    const allowedWithoutProfile = ['/auth', '/settings', '/logout']
    const isAllowed = allowedWithoutProfile.some(route => to.path.startsWith(route))

    if (!isAllowed) {
      return navigateTo('/auth/complete-profile')
    }
  }

  // Check email verification status
  if (!user.email_verified && !to.path.startsWith('/auth/verify-email')) {
    const allowedWithoutVerification = ['/auth', '/logout', '/settings']
    const isAllowed = allowedWithoutVerification.some(route => to.path.startsWith(route))

    if (!isAllowed) {
      return navigateTo('/auth/verify-email')
    }
  }
})
