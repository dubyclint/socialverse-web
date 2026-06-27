// ============================================================================
// FILE: /plugins/01-init-app.client.ts - UNIFIED INITIALIZATION PLUGIN
// ============================================================================
// ✅ FIXED: Single plugin to replace all conflicting plugins
// ✅ FIXED: Proper sequential initialization
// ✅ FIXED: Prevents race conditions
// ============================================================================

import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin({
  name: 'app-init',
  dependsOn: ['pinia', 'supabase'],
  
  async setup(nuxtApp) {
    // Only run on client side
    if (!process.client) return

    console.log('[Init Plugin] 🚀 Starting application initialization...')

    try {
      // Verify Pinia is available
      const pinia = nuxtApp.$pinia
      if (!pinia) {
        console.warn('[Init Plugin] ⚠️ Pinia not available')
        return
      }

      // Verify Supabase is available
      const supabase = nuxtApp.$supabase
      if (!supabase) {
        console.warn('[Init Plugin] ⚠️ Supabase not available')
        return
      }

      console.log('[Init Plugin] ✅ Pinia and Supabase verified')

      // ============================================================================
      // STEP 1: Initialize Auth Store (No dependencies)
      // ============================================================================
      console.log('[Init Plugin] Step 1: Initializing auth store...')
      
      const { useAuthStore } = await import('~/stores/auth')
      const authStore = useAuthStore(pinia)

      if (typeof authStore.hydrateFromStorage === 'function') {
        await authStore.hydrateFromStorage()
        console.log('[Init Plugin] ✅ Auth store hydrated from storage')
      }

      console.log(`[Init Plugin] Auth Status: ${authStore.isAuthenticated ? 'Authenticated' : 'Guest'}`)

      // ============================================================================
      // STEP 2: Initialize Profile Store (Only if authenticated)
      // ============================================================================
      if (authStore.isAuthenticated && authStore.user?.id) {
        console.log('[Init Plugin] Step 2: Initializing profile store...')
        
        const { useProfileStore } = await import('~/stores/profile')
        const profileStore = useProfileStore(pinia)

        if (typeof profileStore.hydrateFromStorage === 'function') {
          await profileStore.hydrateFromStorage()
          console.log('[Init Plugin] ✅ Profile store hydrated from storage')
        }
      } else {
        console.log('[Init Plugin] ℹ️ Skipping profile store (not authenticated)')
      }

      // ============================================================================
      // STEP 3: Initialize Verified Store (Optional)
      // ============================================================================
      console.log('[Init Plugin] Step 3: Initializing verified store...')
      
      const { useVerifiedStore } = await import('~/stores/verified')
      const verifiedStore = useVerifiedStore(pinia)
      console.log('[Init Plugin] ✅ Verified store initialized')

      // ============================================================================
      // STEP 4: Initialize Rank Store (Optional)
      // ============================================================================
      console.log('[Init Plugin] Step 4: Initializing rank store...')
      
      const { useRankStore } = await import('~/stores/rank')
      const rankStore = useRankStore(pinia)
      console.log('[Init Plugin] ✅ Rank store initialized')

      console.log('[Init Plugin] ✅ All stores initialized successfully')
      console.log('[Init Plugin] ✅ Initialization complete')

    } catch (error: any) {
      console.error('[Init Plugin] ❌ Error during initialization:', error?.message || error)
      console.error('[Init Plugin] Stack:', error?.stack)
    }
  }
})

