// ============================================================================
// FILE: /plugins/router-scroll.client.ts
// ============================================================================
// ✅ FIXED - Safe router scroll handling without manipulating history
// This prevents "Cannot set property state" errors

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()

  // ✅ CRITICAL: Only run on client-side
  if (!process.client) {
    return
  }

  router.options.scrollBehavior = (to, from, savedPosition) => {
    try {
      // ✅ SAFE: Use scrollTo instead of manipulating history
      if (savedPosition) {
        return savedPosition
      } else if (to.hash) {
        // Scroll to element by hash
        const element = document.querySelector(to.hash)
        if (element) {
          return {
            el: to.hash,
            behavior: 'smooth',
          }
        }
      } else {
        // Scroll to top
        return { top: 0, behavior: 'smooth' }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[Router Scroll] Error:', err.message)
      return { top: 0 }
    }
  }

  console.log('[Router Scroll] Plugin initialized')
})

