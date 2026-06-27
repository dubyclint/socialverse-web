// ============================================================================
// FILE: /plugins/router-scroll.client.ts
// Description: Safe history-state scroll behavior alignment across Nuxt routing loops.
// ============================================================================
import { defineNuxtPlugin, useRouter } from '#app'

export default defineNuxtPlugin({
  name: 'socialverse-router-scroll',

  // ✅ FIX: Force Pinia core/router layers to load cleanly before extending window scroll behaviors
  dependsOn: ['pinia'],

  setup(nuxtApp) {
    if (!process.client) return

    const router = useRouter()

    router.options.scrollBehavior = (to, from, savedPosition) => {
      try {
        // ✅ SAFE: Yield standard coordinate sets instead of forcing history mutation side-effects
        if (savedPosition) {
          return savedPosition
        } 
        
        if (to.hash) {
          const element = document.querySelector(to.hash)
          if (element) {
            return {
              el: to.hash,
              behavior: 'smooth',
            }
          }
        } 
        
        // Default scroll fallback target to top of viewport
        return { top: 0, behavior: 'smooth' }
        
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        console.error('[Router Scroll] Viewport translation calculation error:', err.message)
        return { top: 0 }
      }
    }

    console.log('[Router Scroll] Plugin initialized safely')
  }
})
