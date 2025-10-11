// middleware/permission.ts
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const { hasPermission, getUserPermissions } = useRBAC()
  
  // Get required permissions from route meta
  const requiredPermissions = to.meta.permissions as string[] || []
  const requireAll = to.meta.requireAllPermissions as boolean || false
  
  if (!user.value) {
    return navigateTo('/auth')
  }
  
  if (requiredPermissions.length === 0) {
    return // No specific permissions required
  }
  
  const userPermissions = getUserPermissions(user.value)
  
  const hasAccess = requireAll 
    ? requiredPermissions.every(permission => hasPermission(userPermissions, permission))
    : requiredPermissions.some(permission => hasPermission(userPermissions, permission))
  
  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Insufficient permissions to access this resource.',
      data: {
        requiredPermissions,
        userPermissions,
        requireAll,
        path: to.path
      }
    })
  }
})
