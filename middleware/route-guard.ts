// FILE: /middleware/route-guard.ts - ROLE-BASED ACCESS CONTROL
// ============================================================================
// NON-GLOBAL MIDDLEWARE - Applied to admin/manager routes via definePageMeta
// Purpose: Enforce role-based access control
// ============================================================================

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server-side rendering
  if (process.server) return

  console.log(`[Route Guard Middleware] Checking route: ${to.path}`)

  try {
    // Get user from auth store
    const authStore = useAuthStore()
    const user = authStore.user

    // If not authenticated, redirect to signin
    if (!user) {
      console.warn(`[Route Guard Middleware] ✗ Unauthenticated user blocked from: ${to.path}`)
      return navigateTo('/auth/signin')
    }

    // Get user role
    const userRole = user.role || 'user'

    // Check admin routes
    if (to.path.startsWith('/admin')) {
      if (userRole !== 'admin') {
        console.warn(`[Route Guard Middleware] ✗ Non-admin user blocked from: ${to.path}`)
        throw createError({
          statusCode: 403,
          statusMessage: 'Admin access required',
        })
      }
      console.log(`[Route Guard Middleware] ✓ Admin user allowed on: ${to.path}`)
    }

    // Check manager routes
    if (to.path.startsWith('/manager')) {
      if (userRole !== 'manager' && userRole !== 'admin') {
        console.warn(`[Route Guard Middleware] ✗ Non-manager user blocked from: ${to.path}`)
        throw createError({
          statusCode: 403,
          statusMessage: 'Manager access required',
        })
      }
      console.log(`[Route Guard Middleware] ✓ Manager user allowed on: ${to.path}`)
    }
  } catch (error) {
    console.error(`[Route Guard Middleware] Error:`, error)
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied',
    })
  }
})
