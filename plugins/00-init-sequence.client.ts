// plugins/00-init-sequence.client.ts
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin({
  name: '00-init-sequence', // This must match the dependsOn string
  
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

        const { useUserStore } = await import('~/stores/user')
        const userStore = useUserStore(pinia)
        
        await userStore.initializeSession()
        console.log('[Init Plugin] ✅ User session and profile hydrated')

        window.__appPluginReady = true
        window.dispatchEvent(new Event('app:plugin-ready'))

      } catch (error: any) {
        console.error('[Init Plugin] ❌ Initialization failed:', error?.message)
        window.__appPluginReady = true
        window.dispatchEvent(new Event('app:plugin-ready'))
      }
    })
  }
})
