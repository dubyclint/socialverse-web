// FILE: /middleware/contact-sync-middleware.ts - CONTACT SYNC
// ============================================================================
// NON-GLOBAL MIDDLEWARE - Applied to post-registration routes
// Purpose: Sync user contacts after registration (background task)
// ============================================================================

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware on server-side rendering
  if (process.server) return

  // Only run on specific routes (e.g., after registration)
  const syncRoutes = ['/profile/complete', '/onboarding']
  const shouldSync = syncRoutes.some(route => to.path.startsWith(route))

  if (!shouldSync) return

  console.log(`[Contact Sync Middleware] Syncing contacts for: ${to.path}`)

  try {
    const authStore = useAuthStore()
    const user = authStore.user

    if (!user) {
      console.log(`[Contact Sync Middleware] No user found, skipping sync`)
      return
    }

    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('auth_token') 
      : null

    if (!token) return

    // Trigger contact sync via API (background task - don't wait)
    useFetch('/api/contacts/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: {
        userId: user.id
      }
    }).catch(error => {
      console.error(`[Contact Sync Middleware] Sync failed:`, error)
      // Don't block navigation if sync fails
    })

    console.log(`[Contact Sync Middleware] ✓ Contact sync initiated for user: ${user.id}`)
  } catch (error) {
    console.error(`[Contact Sync Middleware] Error:`, error)
    // Don't block navigation on errors
  }
})
