import type { DirectiveBinding } from 'vue'

const observers = new WeakMap<Element, IntersectionObserver>()

/**
 * `v-impression="fn"` — fires once when at least half the element has been on
 * screen. Used by the feed to report post impressions to the ranker without a
 * request per card.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('impression', {
    mounted(el: Element, binding: DirectiveBinding<() => void>) {
      if (typeof binding.value !== 'function' || typeof IntersectionObserver === 'undefined') return

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            binding.value()
            observer.disconnect()
            observers.delete(el)
          }
        },
        { threshold: 0.5 }
      )

      observer.observe(el)
      observers.set(el, observer)
    },
    unmounted(el: Element) {
      observers.get(el)?.disconnect()
      observers.delete(el)
    }
  })
})
