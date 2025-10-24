// middleware/session-check.ts
export default defineNuxtRouteMiddleware(async (to) => {
  // Safely get Supabase client with error handling
  let supabase = null
  let user = null

  try {
    supabase = useSupabaseClient()
    user = useSupabaseUser()
  } catch (error) {
    console.warn('Supabase client/user check failed:', error)
    return
  }

  // Skip for public routes
  const publicRoutes = ['/', '/auth', '/explore', '/feed']
  if (publicRoutes.some(route => to.path === route || to.path.startsWith(route + '/'))) {
    return
  }

  // If no user, skip session check
  if (!user) {
    return
  }

  try {
    // Validate current session
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      // Session is invalid, clear user and redirect
      try {
        await supabase.auth.signOut()
      } catch (signOutError) {
        console.warn('Sign out error:', signOutError)
      }
      return navigateTo('/auth?reason=session_expired')
    }

    // Check if session is about to expire (within 5 minutes)
    const expiresAt = new Date(session.expires_at! * 1000)
    const now = new Date()
    const fiveMinutes = 5 * 60 * 1000

    if (expiresAt.getTime() - now.getTime() < fiveMinutes) {
      // Attempt to refresh session
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

        if (refreshError || !refreshData.session) {
          // Refresh failed, redirect to login
          return navigateTo('/auth?reason=session_expired')
        }
      } catch (refreshError) {
        console.warn('Session refresh error:', refreshError)
        return navigateTo('/auth?reason=session_expired')
      }
    }
  } catch (error) {
    console.warn('Session check error:', error)
    return
  }
})
