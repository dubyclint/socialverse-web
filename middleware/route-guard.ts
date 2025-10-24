// middleware/route-guard.ts
export default defineNuxtRouteMiddleware((to) => {
  // Safely get user with error handling
  let user = null
  try {
    user = useSupabaseUser()
  } catch (error) {
    console.warn('Supabase user check failed:', error)
    return
  }

  // If no user, skip this middleware
  if (!user) {
    return
  }

  // Try to get RBAC composable with error handling
  let getUserRole: (user: any) => string
  let canAccessRoute: (path: string, role: string) => boolean

  try {
    const rbac = useRBAC()
    getUserRole = rbac.getUserRole
    canAccessRoute = rbac.canAccessRoute
  } catch (error) {
    console.warn('RBAC composable not available:', error)
    return
  }

  const userRole = getUserRole(user)
  const rbacConfig = useRuntimeConfig().public.rbac

  // Check admin routes
  if (to.path.startsWith('/admin')) {
    if (userRole !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }
  }

  // Check manager routes
  if (to.path.startsWith('/manager')) {
    if (userRole !== 'manager' && userRole !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Manager access required'
      })
    }
  }

  // Protected routes based on existing pages structure
  const protectedRoutes = ['/profile', '/chat', '/inbox', '/trade', '/p2p', '/cross-meet', '/universe', '/my-pocket', '/notifications', '/settings']

  if (protectedRoutes.some(route => to.path.startsWith(route))) {
    if (!canAccessRoute(to.path, userRole)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied'
      })
    }
  }
})
