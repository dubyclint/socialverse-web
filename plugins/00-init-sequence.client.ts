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

        // Initialize ONLY the unified store
        const { useUserStore } = await import('~/stores/user')
        const userStore = useUserStore(pinia)
        
        // Handle session/profile hydration in one call
        await userStore.initializeSession()
        console.log('[Init Plugin] ✅ User session and profile hydrated')

        console.log('[Init Plugin] 🎉 Initialization complete')
        
        // Signal completion
        window.__appPluginReady = true
        window.dispatchEvent(new Event('app:plugin-ready'))

      } catch (error: any) {
        console.error('[Init Plugin] ❌ Initialization failed:', error?.message)
        // Mark as ready to prevent the UI from hanging on the loader
        window.__appPluginReady = true
        window.dispatchEvent(new Event('app:plugin-ready'))
      }
    })
  }
})
