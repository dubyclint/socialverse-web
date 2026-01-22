// ============================================================================  
// FILE: /middleware/auth.ts  
// ============================================================================  
export default defineNuxtRouteMiddleware(async (to, from) => {  
  console.log('[Auth Middleware] ============ AUTH MIDDLEWARE START ============')  
  console.log('[Auth Middleware] Route:', to.path)  
    
  const authStore = useAuthStore()  
    
  // ✅ Ensure auth store is hydrated before any protected route  
  if (!authStore.isHydrated) {  
    console.log('[Auth Middleware] Hydrating auth store...')  
    await authStore.hydrateFromStorage()  
  }  
    
  console.log('[Auth Middleware] Auth status:', {  
    isAuthenticated: authStore.isAuthenticated,  
    hasToken: !!authStore.token,  
    hasUser: !!authStore.user  
  })  
    
  // ✅ Redirect to login if not authenticated  
  if (!authStore.isAuthenticated) {  
    console.log('[Auth Middleware] ❌ Not authenticated, redirecting to login')  
    console.log('[Auth Middleware] ============ AUTH MIDDLEWARE END ============')  
    return navigateTo('/auth/signin')  
  }  
    
  console.log('[Auth Middleware] ✅ User authenticated')  
  console.log('[Auth Middleware] ============ AUTH MIDDLEWARE END ============')  
})  
