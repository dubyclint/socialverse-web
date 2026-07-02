// ============================================================================
// FILE: /middleware/route-guard.ts - ROLE-BASED ACCESS CONTROL
// ============================================================================

export default defineNuxtRouteMiddleware((to) => {
  // 1. Safety Guard for undefined route object
  if (!to || !to.path) return

  const authStore = useAuthStore()
  const tokenCookie = useCookie('auth_token')
  const user = authStore.user

  // 2. Auth Check
  // We check for the token first because on the server, 
  // authStore.user might not be populated until the auth middleware runs.
  if (!tokenCookie.value || !user) {
    console.warn(`[Route Guard] ✗ Unauthenticated access attempt: ${to.path}`)
    return navigateTo('/signin')
  }

  const userRole = user.role || 'user'

  // 3. Admin Route Guard
  if (to.path.startsWith('/admin')) {
    if (userRole !== 'admin') {
      console.warn(`[Route Guard] ✗ Non-admin blocked from: ${to.path}`)
      return abortNavigation(createError({
        statusCode: 403,
        statusMessage: 'Admin access required',
      }))
    }
  }

  // 4. Manager Route Guard
  if (to.path.startsWith('/manager')) {
    if (userRole !== 'manager' && userRole !== 'admin') {
      console.warn(`[Route Guard] ✗ Non-manager blocked from: ${to.path}`)
      return abortNavigation(createError({
        statusCode: 403,
        statusMessage: 'Manager access required',
      }))
    }
  }
})
