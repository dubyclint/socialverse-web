// FILE: /middleware/route-guard.ts - CONSOLIDATED & FIXED
// ============================================================================
// ROLE-BASED ACCESS CONTROL FOR PROTECTED ROUTES
// This is a NON-GLOBAL middleware - only applied to admin/manager routes
// Purpose: Enforce role-based access control
// ============================================================================

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server-side rendering
  if (process.server) return

  console.log(`[Route Guard Middleware] Checking route: ${to.path}`)

  // Skip for public/auth routes
  const publicRoutes = [
    '/',
    '/login',
    '/auth',
    '/auth/signin',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/verify-email',
    '/terms',
    '/privacy',
  ]

  const isPublicRoute = publicRoutes.some(route => 
    to.path === route || to.path.startsWith(route + '/')
  )

  if (isPublicRoute) {
    return
  }

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

  console.log(`[Route Guard Middleware] ✓ User allowed on: ${to.path}`)
})
