// ============================================================================
// FILE: /plugins/01-init-app.client.ts - SECURE UNIFIED INITIALIZATION
// ============================================================================
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin({
  name: 'app-init',
  dependsOn: ['pinia', 'supabase'],
  
  setup(nuxtApp) {
    // Fast path: Only execute on the client side
    if (!process.client) return

    // ✅ CRITICAL FIX: Push the initialization waterfall until AFTER the app is fully hydrated
    nuxtApp.hook('app:mounted', async () => {
      console.log('[Init Plugin] 🚀 Starting application initialization post-mount...')

      try {
        // Verify Pinia instance is active in the current application context
        const pinia = nuxtApp.$pinia
        if (!pinia) {
          console.warn('[Init Plugin] ⚠️ Pinia instance is not ready yet.')
          return
        }

        // Verify Supabase instance is active
        const supabase = nuxtApp.$supabase
        if (!supabase) {
          console.warn('[Init Plugin] ⚠️ Supabase instance is not ready yet.')
          return
        }

        console.log('[Init Plugin] ✅ Pinia and Supabase layers verified.')

        // ============================================================================
        // STEP 1: Initialize Auth Store (Zero dependencies)
        // ============================================================================
        console.log('[Init Plugin] Step 1: Loading Auth Store chunk...')
        const { useAuthStore } = await import('~/stores/auth')
        const authStore = useAuthStore(pinia)

        if (typeof authStore.hydrateFromStorage === 'function') {
          await authStore.hydrateFromStorage()
          console.log('[Init Plugin] ✅ Auth store state hydrated safely.')
        }

        console.log(`[Init Plugin] Auth Context: ${authStore.isAuthenticated ? 'Authenticated' : 'Guest'}`)

        // ============================================================================
        // STEP 2: Initialize Profile Store (Dependent on authenticated status)
        // ============================================================================
        if (authStore.isAuthenticated && (authStore.userId || authStore.user?.id)) {
          console.log('[Init Plugin] Step 2: Loading Profile Store chunk...')
          const { useProfileStore } = await import('~/stores/profile')
          const profileStore = useProfileStore(pinia)

          if (typeof profileStore.hydrateFromStorage === 'function') {
            await profileStore.hydrateFromStorage()
            console.log('[Init Plugin] ✅ Profile store state hydrated safely.')
          }
        } else {
          console.log('[Init Plugin] ℹ️ Skipping profile state hydration (Guest user context)')
        }

        // ============================================================================
        // STEP 3: Initialize Verified Store
        // ============================================================================
        console.log('[Init Plugin] Step 3: Loading Verified Store chunk...')
        const { useVerifiedStore } = await import('~/stores/verified')
        const verifiedStore = useVerifiedStore(pinia)
        console.log('[Init Plugin] ✅ Verified store execution scope verified.')

        // ============================================================================
        // STEP 4: Initialize Rank Store
        // ============================================================================
        console.log('[Init Plugin] Step 4: Loading Rank Store chunk...')
        const { useRankStore } = await import('~/stores/rank')
        const rankStore = useRankStore(pinia)
        console.log('[Init Plugin] ✅ Rank store execution scope verified.')

        console.log('[Init Plugin] 🎉 All app stores initialized without deadlocks.')

      } catch (error: any) {
        console.error('[Init Plugin] ❌ Critical failure during runtime store initialization:', error?.message || error)
        console.error('[Init Plugin] Stack Trace:', error?.stack)
      }
    })
  }
})
