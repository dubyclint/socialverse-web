// middleware/auth-check.global.ts
export default defineNuxtRouteMiddleware((to) => {
  // Safely get Supabase user with error handling
  let user = null
  try {
    user = useSupabaseUser()
  } catch (error) {
    console.warn('Supabase user check failed:', error)
    user = null
  }
  
  // Get RBAC configuration from runtime config
  const config = useRuntimeConfig()
  const rbacConfig = config.public.rbac
  
  // Routes that don't require authentication (PUBLIC ROUTES)
  const publicRoutes = [
    '/',                           // Homepage (shows different content based on auth)
    '/auth',
    '/auth/login',
    '/auth/register',
    '/auth/signup',
    '/auth/forgot-password',
    '/about',
    '/features',
    '/pricing',
    '/blog'
  ]
  
  const isPublicRoute = publicRoutes.some(route => 
    to.path === route || to.path.startsWith(route + '/')
  )
  
  // Skip auth check for public routes
  if (isPublicRoute) {
    return
  }
  
  // Check if user is authenticated for protected routes
  if (rbacConfig && rbacConfig.protectedRoutes && rbacConfig.protectedRoutes.some((route: string) => 
    to.path.startsWith(route.replace('*', ''))
  )) {
    if (!user) {
      return navigateTo('/auth/login')
    }
  }
})
