// ============================================================================  
// FILE: /middleware/profile-completion.ts - COMPLETE FIXED VERSION  
// ============================================================================  
// Purpose: Validate and enforce profile completion flow  
//   
// Behavior:  
// - Allows access to public pages (auth, login, signup)  
// - Redirects incomplete profiles to /profile/complete  
// - Allows access to profile edit/complete pages  
// - Enforces profile completion before accessing feed/main app  
// ============================================================================  
export default defineNuxtRouteMiddleware(async (to, from) => {  
  // Skip on server-side  
  if (process.server) return  
  console.log('[ProfileCompletion] Middleware triggered for route:', to.path)  
  // ============================================================================  
  // PUBLIC ROUTES - NO MIDDLEWARE CHECK  
  // ============================================================================  
  const publicRoutes = [  
    '/auth/signin',  
    '/auth/signup',  
    '/auth/forgot-password',  
    '/auth/reset-password',  
    '/login',  
    '/signup',  
    '/terms-and-policy',  
    '/error'  
  ]  
  if (publicRoutes.some(route => to.path.startsWith(route))) {  
    console.log('[ProfileCompletion] Public route, skipping middleware')  
    return  
  }  
  // ============================================================================  
  // PROFILE MANAGEMENT ROUTES - ALLOW ACCESS  
  // ============================================================================  
  const profileRoutes = [  
    '/profile/edit',  
    '/profile/complete',  
    '/settings'  
  ]  
  if (profileRoutes.some(route => to.path.startsWith(route))) {  
    console.log('[ProfileCompletion] Profile management route, allowing access')  
    return  
  }  
  // ============================================================================  
  // GET AUTH STATE  
  // ============================================================================  
  const authStore = useAuthStore()  
  const profileStore = useProfileStore()  
  console.log('[ProfileCompletion] Auth state:', {  
    isAuthenticated: authStore.isAuthenticated,  
    hasUser: !!authStore.user,  
    userId: authStore.user?.id,  
    hasToken: !!authStore.token  
  })  
  // ============================================================================  
  // NOT AUTHENTICATED - REDIRECT TO LOGIN  
  // ============================================================================  
  if (!authStore.isAuthenticated || !authStore.user || !authStore.token) {  
    console.log('[ProfileCompletion] ❌ User not authenticated, redirecting to signin')  
    return navigateTo('/auth/signin')  
  }  
  // ============================================================================  
  // FETCH PROFILE IF NOT IN STORE  
  // ============================================================================  
  let profile = profileStore.profile  
  if (!profile) {  
    console.log('[ProfileCompletion] Profile not in store, fetching from API...')  
    try {  
      await profileStore.fetchProfile(authStore.user.id)  
      profile = profileStore.profile  
      console.log('[ProfileCompletion] ✅ Profile fetched:', profile?.id)  
    } catch (error) {  
      console.error('[ProfileCompletion] ❌ Error fetching profile:', error)  
      // Continue with null profile - will redirect to complete  
    }  
  }  
  // ============================================================================  
  // PROFILE COMPLETION CHECK  
  // ============================================================================  
  const isProfileComplete = profile?.profile_completed === true  
  console.log('[ProfileCompletion] Profile completion status:', {  
    profileExists: !!profile,  
    isComplete: isProfileComplete,  
    profileId: profile?.id,  
    username: profile?.username,  
    fullName: profile?.full_name  
  })  
  // ============================================================================  
  // INCOMPLETE PROFILE - REDIRECT TO COMPLETION PAGE  
  // ============================================================================  
  if (!isProfileComplete) {  
    console.log('[ProfileCompletion] ⚠️ Profile incomplete, redirecting to /profile/complete')  
    return navigateTo('/profile/complete')  
  }  
  // ============================================================================  
  // PROFILE COMPLETE - ALLOW ACCESS  
  // ============================================================================  
  console.log('[ProfileCompletion] ✅ Profile complete, allowing access to:', to.path)  
  return  
})  

