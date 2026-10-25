// ============================================================================
// FILE: /middleware/guest.ts - STABLE GUEST GUARD
// ============================================================================
import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useSupabaseUser } from '#imports'
import { useMfa } from '~/composables/use-mfa'

export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()

  // If a user session exists, redirect away from guest pages (like signin) to feed.
  if (user.value) {
    // Password accepted but the authenticator code is still owed: stay on sign-in.
    if (await useMfa().isPending().catch(() => false)) return
    return navigateTo('/feed', { replace: true })
  }
})
