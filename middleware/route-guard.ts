// ============================================================================
// FILE: /middleware/route-guard.ts - ROLE-BASED ACCESS CONTROL
// ============================================================================
import { defineNuxtRouteMiddleware, navigateTo, abortNavigation, createError } from '#app'
import { useSupabaseUser, useSupabaseClient } from '#imports'

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to?.path) return

  const user = useSupabaseUser()
  const client = useSupabaseClient()

  if (!user.value) {
    console.warn(`[Route Guard] ✗ Unauthenticated access attempt: ${to.path}`)
    return navigateTo('/signin')
  }

  // Fetch full user profile/metadata including roles if not present on user object
  let userRole = 'user'
  try {
    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.value.id)
      .single()
      
    if (profile && 'role' in profile) {
      userRole = (profile as { role?: string }).role || 'user'
    }
  } catch (e) {
    console.error('[Route Guard] Failed to resolve user role profile:', e)
  }

  if (to.path.startsWith('/admin') && userRole !== 'admin') {
    console.warn(`[Route Guard] ✗ Non-admin blocked from: ${to.path}`)
    return abortNavigation(createError({
      statusCode: 403,
      statusMessage: 'Admin access required',
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
