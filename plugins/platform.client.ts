import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

/**
 * Tags the root element with the running platform so CSS can apply native-only
 * behaviour, and routes native deep links back into vue-router.
 */
export default defineNuxtPlugin(() => {
  const capacitorPlatform = Capacitor.getPlatform()
  const platform = capacitorPlatform === 'web' && window.viorpDesktop?.platform === 'electron'
    ? 'electron'
    : capacitorPlatform
  const root = document.documentElement

  root.classList.remove('platform-web', 'platform-android', 'platform-ios', 'platform-electron')
  root.classList.add(`platform-${platform}`)
  if (Capacitor.isNativePlatform()) root.classList.add('platform-native')

  const router = useRouter()
  const config = useRuntimeConfig()
  const appDomain = String(config.public.appDomain || '')

  const routeDeepLink = (rawUrl: string) => {
    try {
      const url = new URL(rawUrl)
      const isOwnDomain = appDomain ? url.host === new URL(appDomain).host : false
      const isCustomScheme = url.protocol.startsWith('viorp')
      if (!isOwnDomain && !isCustomScheme) return
      router.push(`${url.pathname}${url.search}${url.hash}` || '/')
    } catch {
      // Ignore malformed deep links rather than crashing the shell.
    }
  }

  if (platform === 'electron') {
    window.viorpDesktop?.onDeepLink(routeDeepLink)
    return
  }

  if (!Capacitor.isNativePlatform()) return

  CapacitorApp.addListener('appUrlOpen', (event) => routeDeepLink(event.url))

  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) router.back()
    else CapacitorApp.exitApp()
  })
})
