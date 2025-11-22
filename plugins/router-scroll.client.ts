// /plugins/router-scroll.client.ts
import { nextTick } from 'vue'

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  
  if (!router) {
    console.warn('[Router Scroll Plugin] Router not available')
    return
  }

  // Handle scroll behavior on route change
  router.afterEach((to, from) => {
    const savedPosition = window.history.state?.scrollPosition
    
    if (savedPosition) {
      nextTick(() => {
        window.scrollTo(savedPosition.x, savedPosition.y)
      })
    } else {
      nextTick(() => {
        window.scrollTo(0, 0)
      })
    }
  })

  // Save scroll position before leaving route
  router.beforeEach((to, from, next) => {
    if (typeof window !== 'undefined') {
      window.history.state = {
        ...window.history.state,
        scrollPosition: {
          x: window.scrollX,
          y: window.scrollY
        }
      }
    }
    next()
  })

  console.log('[Router Scroll Plugin] Initialized')
})
