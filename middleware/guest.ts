// ============================================================================
// FILE: /middleware/guest.ts - STABLE GUEST GUARD
// ============================================================================
import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useMfa } from '~/composables/use-mfa'

export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()

  // Redirect away from guest pages only for a session the auth server still accepts;
  // a stale or expired local session is cleared so visitors stay on sign-in/sign-up.
  // Network failures are not treated as a rejected session.
  if (user.value) {
    if (import.meta.client) {
      const supabase = useSupabaseClient()
      const { data, error } = await supabase.auth.getUser()
      const rejected = error ? [401, 403].includes(Number(error.status)) || error.name === 'AuthSessionMissingError' : !data?.user
      if (rejected) {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined)
        return
      }
    }
    // Password accepted but the authenticator code is still owed: stay on sign-in.
    if (await useMfa().isPending().catch(() => false)) return
    return navigateTo('/feed', { replace: true })
  }
})
