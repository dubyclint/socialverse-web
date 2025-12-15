// FILE: /plugins/auth.client.ts (FIXED FOR SSR)
export default defineNuxtPlugin(async (nuxtApp) => {
  try {
    // ✅ Only run on client-side
    if (!process.client) {
      console.log('[Auth Plugin] Running on server - skipping')
      return
    }

    const authStore = useAuthStore()
    const { $supabase } = nuxtApp

    console.log('[Auth Plugin] Starting initialization...')

    if (!$supabase) {
      console.warn('[Auth Plugin] ⚠️ Supabase client not available')
      return
    }

    // Get current session
    const { data: { session }, error } = await $supabase.auth.getSession()

    if (error) {
      console.error('[Auth Plugin] ❌ Session error:', error.message)
      return
    }

    if (session?.user) {
      console.log('[Auth Plugin] ✅ User session found:', session.user.id)
      authStore.setUser(session.user)
    } else {
      console.log('[Auth Plugin] No active session')
    }
  } catch (err: any) {
    console.error('[Auth Plugin] ❌ Error:', err.message)
  }
})

