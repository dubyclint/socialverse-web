// middleware/admin-auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const { getUserRole, hasRole } = useRBAC()
  
  // Check if user is authenticated
  if (!user.value) {
    // Store intended admin destination
    const redirectCookie = useCookie('admin-redirect', {
      default: () => '/admin',
      maxAge: 60 * 15
    })
    redirectCookie.value = to.fullPath
    
    return navigateTo('/auth')
  }
  
  // Check if user has admin role
  const userRole = getUserRole(user.value)
  if (!hasRole(userRole, 'admin')) {
    // Log unauthorized access attempt
    console.warn(`Unauthorized admin access attempt by user ${user.value.id} with role ${userRole}`)
    
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Admin privileges required.',
      data: {
        requiredRole: 'admin',
        userRole: userRole,
        userId: user.value.id,
        attemptedPath: to.path,
        timestamp: new Date().toISOString()
      }
    })
  }
  
  // Optional: Log successful admin access
  console.info(`Admin access granted to user ${user.value.id} for path ${to.path}`)
})
