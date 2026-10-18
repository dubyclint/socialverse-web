// ============================================================================
// FILE: /middleware/route-guard.ts - ROLE-BASED ACCESS CONTROL
// ============================================================================
import { defineNuxtRouteMiddleware, navigateTo, abortNavigation, createError } from '#app'
import { useSupabaseUser } from '#imports'
import { useStaff } from '~/composables/useStaff'

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to?.path) return

  const user = useSupabaseUser()

  if (!user.value) {
    console.warn(`[Route Guard] ✗ Unauthenticated access attempt: ${to.path}`)
    return navigateTo('/signin')
  }

  // Role comes from the server: authenticated clients cannot read user.role directly.
  const staff = await useStaff().load(true)
  const userRole = staff?.role ?? 'user'

  if (to.path.startsWith('/admin') && userRole !== 'admin' && userRole !== 'manager') {
    console.warn(`[Route Guard] ✗ Non-admin blocked from: ${to.path}`)
    return abortNavigation(createError({
      statusCode: 403,
      statusMessage: 'Admin or manager access required',
    }))
  }

  if (to.path.startsWith('/manager') && userRole !== 'manager' && userRole !== 'admin') {
    console.warn(`[Route Guard] ✗ Non-manager blocked from: ${to.path}`)
    return abortNavigation(createError({
      statusCode: 403,
      statusMessage: 'Manager access required',
    }))
  }
})
