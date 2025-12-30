export default defineNuxtRouteMiddleware((to, from) => {
  if (process.server) return

  console.log(`[Auth Middleware] Checking route: ${to.path}`)

  const publicRoutes = [
    '/',
    '/login',
    '/auth',
    '/auth/signin',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/verify-email',
    '/auth/reset-password',
    '/auth/confirm',
    '/terms',
    '/privacy',
    '/about',
  ]

  const isPublicRoute = publicRoutes.some(route => 
    to.path === route || to.path.startsWith(route + '/')
  )

  if (isPublicRoute) {
    console.log(`[Auth Middleware] ✓ Public route allowed: ${to.path}`)
    return
  }

  try {
    const authStore = useAuthStore()
    
    // ✅ CRITICAL FIX: Wait for store to be hydrated
    if (!authStore.isHydrated) {
      console.log(`[Auth Middleware] ⏳ Store not hydrated yet, waiting...`)
      return
    }

    // ✅ CRITICAL FIX: Check store state instead of localStorage directly
    if (!authStore.isAuthenticated || !authStore.token || !authStore.user) {
      console.warn(`[Auth Middleware] ✗ Unauthorized access to protected route: ${to.path}`)
      return navigateTo('/auth/signin')
    }

    console.log(`[Auth Middleware] ✓ Authenticated user accessing: ${to.path}`)
  } catch (error) {
    console.error(`[Auth Middleware] Error checking auth:`, error)
    return navigateTo('/auth/signin')
  }
})
