// plugins/00-init-sequence.client.ts
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin({
  name: '00-init-sequence',
  
  setup(nuxtApp: any) {
    if (!process.client) return

    nuxtApp.hook('app:mounted', async () => {
      console.log('[Init Plugin] 🚀 Starting application initialization...')

      try {
        // Session hydration is now handled natively by @nuxtjs/supabase module.
        // We only retain genuine app-level initializations here.

        window.__appPluginReady = true
        window.dispatchEvent(new Event('app:plugin-ready'))
        console.log('[Init Plugin] ✅ Application initialization complete')

      } catch (error: any) {
        console.error('[Init Plugin] ❌ Initialization failed:', error?.message)
        window.__appPluginReady = true
        window.dispatchEvent(new Event('app:plugin-ready'))
      }
    })
  }
})
