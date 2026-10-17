import { Capacitor } from '@capacitor/core'

interface ExternalAds {
  monetag_enabled: boolean
  monetag_social_bar_src: string
  monetag_smartlink_url: string
  transition_cooldown_minutes: number
}

const AD_FREE_ROUTE = /^\/(wallet|add-funds|pewgift|escrow|p2p|monetization|admin|signin|signup|auth|terms|privacy|settings\/(payment|wallet))/
const SESSION_KEY = 'viorp:smartlink-shown'
const LAST_KEY = 'viorp:smartlink-last'

/**
 * Monetag for Web/PWA only: a global social bar plus at most one smartlink
 * transition per session (with a cooldown). Native apps use Appodeal instead,
 * and financial screens never show external ads.
 */
export default defineNuxtPlugin(() => {
  if (Capacitor.isNativePlatform()) return
  const router = useRouter()
  const root = document.documentElement
  let config: ExternalAds | null = null
  let socialBarLoaded = false

  const isAdFree = (path: string) => AD_FREE_ROUTE.test(path)

  const syncRoute = (path: string) => {
    const adFree = isAdFree(path)
    root.classList.toggle('ads-suppressed', adFree)
    if (!config?.monetag_enabled || !config.monetag_social_bar_src || adFree || socialBarLoaded) return
    socialBarLoaded = true
    const script = document.createElement('script')
    script.src = config.monetag_social_bar_src
    script.async = true
    script.dataset.cfasync = 'false'
    document.body.appendChild(script)
  }

  const smartlinkEligible = (target: string) => {
    if (!config?.monetag_enabled || !config.monetag_smartlink_url) return false
    if (isAdFree(router.currentRoute.value.path) || isAdFree(target)) return false
    if (sessionStorage.getItem(SESSION_KEY)) return false
    const last = Number(localStorage.getItem(LAST_KEY) || 0)
    return Date.now() - last >= Math.max(1, config.transition_cooldown_minutes) * 60000
  }

  document.addEventListener('click', (event) => {
    const anchor = (event.target as HTMLElement | null)?.closest?.('a[href^="/"]') as HTMLAnchorElement | null
    if (!anchor) return
    const target = anchor.getAttribute('href') ?? ''
    if (!/^\/(posts|profile|pages|explore|stream)\//.test(target) || !smartlinkEligible(target)) return
    sessionStorage.setItem(SESSION_KEY, '1')
    localStorage.setItem(LAST_KEY, String(Date.now()))
    window.open(config!.monetag_smartlink_url, '_blank', 'noopener,noreferrer')
  }, { capture: true })

  router.afterEach(to => syncRoute(to.path))

  $fetch<{ external: ExternalAds }>('/api/ads/config')
    .then((res) => {
      config = res.external
      syncRoute(router.currentRoute.value.path)
    })
    .catch(error => console.warn('[Ads] external ad config unavailable', error))
})
