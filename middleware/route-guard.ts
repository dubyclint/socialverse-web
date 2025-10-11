// middleware/route-guard.ts
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const { getUserRole, canAccessRoute } = useRBAC()
  const config = useRuntimeConfig()
  
  if (!user.value) {
    return // Let auth-check handle this
  }
  
  const userRole = getUserRole(user.value)
  const rbacConfig = config.public.rbac
  
  // Check admin routes - based on your existing /pages/admin/ structure
  if (to.path.startsWith('/admin')) {
    if (userRole !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }
  }
  
  // Check manager routes (if you add manager pages)
  if (to.path.startsWith('/manager')) {
    if (userRole !== 'manager' && userRole !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Manager access required'
      })
    }
  }
  
  // Protected routes based on your existing pages structure
  const protectedRoutes = ['/profile', '/chat', '/inbox', '/trade', '/groups']
  if (protectedRoutes.some(route => to.path.startsWith(route))) {
    if (!user.value) {
      return navigateTo('/auth')
    }
  }
})
