// ============================================================================
// FILE: /middleware/guest.ts - STABLE GUEST GUARD
// ============================================================================
import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useSupabaseUser } from '#imports'

export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()

  // If a user session exists, redirect away from guest pages (like signin) to feed.
  if (user.value) {
    return navigateTo('/feed', { replace: true })
  }
})
