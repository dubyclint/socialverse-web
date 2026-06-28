// /plugins/01-init-app.client.ts
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin({
  name: 'app-init',
  dependsOn: ['pinia', 'supabase'],
  
  setup(nuxtApp) {
    if (!process.client) return

    nuxtApp.hook('app:mounted', async () => {
      console.log('[Init Plugin] 🚀 Starting application initialization...')

      try {
        const pinia = nuxtApp.$pinia
        const supabase = nuxtApp.$supabase

        if (!pinia || !supabase) {
          console.warn('[Init Plugin] ⚠️ Pinia or Supabase not ready')
          return
        }

        // Auth Store
        const { useAuthStore } = await import('~/stores/auth')
        const authStore = useAuthStore(pinia)
        await authStore.hydrateFromStorage?.()
        console.log('[Init Plugin] ✅ Auth store hydrated')

        // Profile Store (only if authenticated)
        if (authStore.isAuthenticated && (authStore.userId || authStore.user?.id)) {
          const { useProfileStore } = await import('~/stores/profile')
          const profileStore = useProfileStore(pinia)
          await profileStore.hydrateFromStorage?.()
          console.log('[Init Plugin] ✅ Profile store hydrated')
        }

        // Verified Store
        const { useVerifiedStore } = await import('~/stores/verified')
        useVerifiedStore(pinia)
        console.log('[Init Plugin] ✅ Verified store initialized')

        // Rank Store
        const { useRankStore } = await import('~/stores/rank')
        useRankStore(pinia)
        console.log('[Init Plugin] ✅ Rank store initialized')

        console.log('[Init Plugin] 🎉 All stores initialized successfully')
        
        // Signal completion
        window.__appPluginReady = true
        window.dispatchEvent(new Event('app:plugin-ready'))

      } catch (error: any) {
        console.error('[Init Plugin] ❌ Initialization failed:', error?.message)
      }
    })
  }
})

