// middleware/admin-auth.ts
// Only for /admin routes
export default defineNuxtRouteMiddleware((to) => {
  // Only run on admin routes
  if (!to.path.startsWith('/admin')) {
    return
  }

  // Safely get user with error handling
  let user = null
  try {
    user = useSupabaseUser()
  } catch (error) {
    console.warn('Supabase user check failed:', error)
    const redirectCookie = useCookie('admin-redirect', {
      default: () => '/admin',
      maxAge: 60 * 15
    })
    redirectCookie.value = to.fullPath
    return navigateTo('/auth/login')
  }

  // Check if user is authenticated
  if (!user) {
    const redirectCookie = useCookie('admin-redirect', {
      default: () => '/admin',
      maxAge: 60 * 15
    })
    redirectCookie.value = to.fullPath
    return navigateTo('/auth/login')
  }

  // Try to get RBAC composable with error handling
  let getUserRole: (user: any) => string
  let hasRole: (role: string, requiredRole: string) => boolean

  try {
    const rbac = useRBAC()
    getUserRole = rbac.getUserRole
    hasRole = rbac.hasRole
  } catch (error) {
    console.warn('RBAC composable not available:', error)
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Admin privileges required.'
    })
  }

  // Check if user has admin role
  const userRole = getUserRole(user)
  if (!hasRole(userRole, 'admin')) {
    console.warn(`Unauthorized admin access attempt by user ${user.id} with role ${userRole}`)
    
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Admin privileges required.',
      data: {
        requiredRole: 'admin',
        userRole: userRole,
        userId: user.id,
        attemptedPath: to.path,
        timestamp: new Date().toISOString()
      }
    })
  }
})
