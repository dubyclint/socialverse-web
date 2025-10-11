// middleware/auth-check.global.ts
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const { $i18n } = useNuxtApp()
  
  // Get RBAC configuration from runtime config
  const config = useRuntimeConfig()
  const rbacConfig = config.public.rbac
  
  // Routes that don't require authentication
  const publicRoutes = ['/', '/auth', '/auth/login', '/auth/register', '/auth/forgot-password']
  const isPublicRoute = publicRoutes.some(route => 
    to.path === route || to.path.startsWith(route + '/')
  )
  
  // Skip auth check for public routes
  if (isPublicRoute) {
    return
  }
  
  // Check if user is authenticated for protected routes
  if (rbacConfig.protectedRoutes.some((route: string) => 
    to.path.startsWith(route.replace('*', ''))
  )) {
    if (!user.value) {
      // Store intended destination for redirect after login
      const redirectCookie = useCookie('auth-redirect', {
        default: () => '/',
        maxAge: 60 * 15 // 15 minutes
      })
      redirectCookie.value = to.fullPath
      
      return navigateTo('/auth/login')
    }
  }
})
