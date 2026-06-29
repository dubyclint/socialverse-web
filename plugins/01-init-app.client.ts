// /plugins/01-init-app.client.ts
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin({
  name: 'app-init',
  
  setup(nuxtApp) {
    if (!process.client) return

    nuxtApp.hook('app:mounted', async () => {
      console.log('[Init Plugin] 🚀 Starting application initialization...')

      try {
        const pinia = nuxtApp.$pinia
        if (!pinia) {
          console.warn('[Init Plugin] ⚠️ Pinia not ready')
          return
        }

        // Initialize stores WITHOUT importing them directly
        // This avoids circular dependency issues
        const { useAuthStore } = await import('~/stores/auth')
        const authStore = useAuthStore(pinia)
        
        // Only hydrate if auth store has the method
        if (typeof authStore.hydrateFromStorage === 'function') {
          await authStore.hydrateFromStorage()
          console.log('[Init Plugin] ✅ Auth store hydrated')
        }

        // Only initialize profile store if user is authenticated
        if (authStore.isAuthenticated) {
          try {
            const { useProfileStore } = await import('~/stores/profile')
            const profileStore = useProfileStore(pinia)
            if (typeof profileStore.hydrateFromStorage === 'function') {
              await profileStore.hydrateFromStorage()
              console.log('[Init Plugin] ✅ Profile store hydrated')
            }
          } catch (err) {
            console.warn('[Init Plugin] ⚠️ Profile store initialization skipped:', err)
          }
        }

        console.log('[Init Plugin] 🎉 Initialization complete')
        
        // Signal completion
        window.__appPluginReady = true
        window.dispatchEvent(new Event('app:plugin-ready'))

      } catch (error: any) {
        console.error('[Init Plugin] ❌ Initialization failed:', error?.message)
        // Still mark as ready to prevent infinite loading
        window.__appPluginReady = true
        window.dispatchEvent(new Event('app:plugin-ready'))
      }
    })
  }
})
