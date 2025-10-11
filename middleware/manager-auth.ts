// middleware/manager-auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const { getUserRole, hasRole } = useRBAC()
  
  // Check if user is authenticated
  if (!user.value) {
    const redirectCookie = useCookie('manager-redirect', {
      default: () => '/manager',
      maxAge: 60 * 15
    })
    redirectCookie.value = to.fullPath
    
    return navigateTo('/auth')
  }
  
  // Check if user has manager or admin role
  const userRole = getUserRole(user.value)
  if (!hasRole(userRole, 'manager') && !hasRole(userRole, 'admin')) {
    console.warn(`Unauthorized manager access attempt by user ${user.value.id} with role ${userRole}`)
    
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Manager privileges required.',
      data: {
        requiredRole: 'manager',
        userRole: userRole,
        userId: user.value.id,
        attemptedPath: to.path,
        timestamp: new Date().toISOString()
      }
    })
  }
})
