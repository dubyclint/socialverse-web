// middleware/session-check.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  
  // Skip for public routes based on your pages structure
  const publicRoutes = ['/', '/auth', '/explore', '/feed']
  if (publicRoutes.some(route => to.path === route || to.path.startsWith(route + '/'))) {
    return
  }
  
  if (user.value) {
    try {
      // Validate current session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        // Session is invalid, clear user and redirect
        await supabase.auth.signOut()
        return navigateTo('/auth?reason=session_expired')
      }
      
      // Check if session is about to expire (within 5 minutes)
      const expiresAt = new Date(session.expires_at! * 1000)
      const now = new Date()
      const fiveMinutes = 5 * 60 * 1000
      
      if (expiresAt.getTime() - now.getTime() < fiveMinutes) {
        // Attempt to refresh the session
        const { error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          console.warn('Failed to refresh session:', refreshError)
          return navigateTo('/auth?reason=session_refresh_failed')
        }
      }
    } catch (error) {
      console.error('Session validation error:', error)
      return navigateTo('/auth?reason=session_error')
    }
  }
})
