// ============================================================================
// FILE: /middleware/route-guard.ts - ROLE-BASED ACCESS CONTROL
// ============================================================================
import { useUserStore } from '~/stores/user'

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to?.path) return

  const userStore = useUserStore()
  const tokenCookie = useCookie('auth_token')

  // 1. Ensure user state is hydrated (handles page refresh)
  if (tokenCookie.value && !userStore.user) {
    try {
      await userStore.fetchProfile()
    } catch (e) {
      userStore.logout()
    }
  }

  const user = userStore.user

  // 2. Auth Check: If no token or no user, redirect to signin
  if (!tokenCookie.value || !user) {
    console.warn(`[Route Guard] ✗ Unauthenticated access attempt: ${to.path}`)
    return navigateTo('/signin')
  }

  const userRole = user.role || 'user'

  // 3. Admin Route Guard
  if (to.path.startsWith('/admin') && userRole !== 'admin') {
    console.warn(`[Route Guard] ✗ Non-admin blocked from: ${to.path}`)
    return abortNavigation(createError({
      statusCode: 403,
      statusMessage: 'Admin access required',
    }))
  }

  // 4. Manager Route Guard
  if (to.path.startsWith('/manager') && userRole !== 'manager' && userRole !== 'admin') {
    console.warn(`[Route Guard] ✗ Non-manager blocked from: ${to.path}`)
    return abortNavigation(createError({
      statusCode: 403,
      statusMessage: 'Manager access required',
    }))
  }
})
