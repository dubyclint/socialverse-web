// middleware/permission.ts
export default defineNuxtRouteMiddleware((to) => {
  // Safely get user with error handling
  let user = null
  try {
    user = useSupabaseUser()
  } catch (error) {
    console.warn('Supabase user check failed:', error)
    return
  }

  // Get required permissions from route meta
  const requiredPermissions = to.meta.permissions as string[] || []
  const requireAll = to.meta.requireAllPermissions as boolean || false

  // If no permissions required, allow access
  if (requiredPermissions.length === 0) {
    return
  }

  // If no user and permissions required, redirect to login
  if (!user) {
    return navigateTo('/auth/login')
  }

  // Try to get RBAC composable with error handling
  let hasPermission: (permissions: string[], permission: string) => boolean
  let getUserPermissions: (user: any) => string[]

  try {
    const rbac = useRBAC()
    hasPermission = rbac.hasPermission
    getUserPermissions = rbac.getUserPermissions
  } catch (error) {
    console.warn('RBAC composable not available:', error)
    return
  }

  const userPermissions = getUserPermissions(user)

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
      }
    })
  }
})
