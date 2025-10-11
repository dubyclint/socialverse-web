// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  
  if (!user.value) {
    // Store the intended destination
    const redirectCookie = useCookie('auth-redirect', {
      default: () => '/',
      maxAge: 60 * 15 // 15 minutes
    })
    redirectCookie.value = to.fullPath
    
    return navigateTo('/auth')
  }
  
  // Optional: Check if user account is active/verified
  const { isUserActive } = useAuth()
  if (isUserActive && !isUserActive(user.value)) {
    return navigateTo('/auth/verify-account')
  }
})
