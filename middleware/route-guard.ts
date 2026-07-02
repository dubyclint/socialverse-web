// FILE: /middleware/route-guard.ts - ROLE-BASED ACCESS CONTROL
// ============================================================================
// NON-GLOBAL MIDDLEWARE - Applied to admin/manager routes via definePageMeta
// Purpose: Enforce role-based access control securely on both client and server
// ============================================================================

export default defineNuxtRouteMiddleware((to, from) => {
  // 🚨 CRITICAL SECURITY FIX: Removed `if (process.server) return`
  // Middleware MUST run on the server to prevent Nuxt from sending protected 
  // HTML to unauthorized users before the client takes over.

  console.log(`[Route Guard Middleware] Checking route: ${to.path}`)

  // Get user from auth store 
  // (Note: Ensure your auth store hydrates state via cookies so the server knows the user)
  const authStore = useAuthStore()
  const user = authStore.user

  // If not authenticated, redirect to signin
  if (!user) {
    console.warn(`[Route Guard Middleware] ✗ Unauthenticated user blocked from: ${to.path}`)
    // Nuxt handles this gracefully on the server by sending an HTTP redirect
    return navigateTo('/signin')
  }

  // Get user role
  const userRole = user.role || 'user'

  // Check admin routes
  if (to.path.startsWith('/admin')) {
    if (userRole !== 'admin') {
      console.warn(`[Route Guard Middleware] ✗ Non-admin user blocked from: ${to.path}`)
      // ✅ FIX: Use abortNavigation() which is the idiomatic way to block routes in Nuxt
      return abortNavigation(
        createError({
          statusCode: 403,
          statusMessage: 'Admin access required',
        })
      )
    }
    console.log(`[Route Guard Middleware] ✓ Admin user allowed on: ${to.path}`)
  }

  // Check manager routes
  if (to.path.startsWith('/manager')) {
    if (userRole !== 'manager' && userRole !== 'admin') {
      console.warn(`[Route Guard Middleware] ✗ Non-manager user blocked from: ${to.path}`)
      // ✅ FIX: Use abortNavigation() 
      return abortNavigation(
        createError({
          statusCode: 403,
          statusMessage: 'Manager access required',
        })
      )
    }
    console.log(`[Route Guard Middleware] ✓ Manager user allowed on: ${to.path}`)
  }
})
