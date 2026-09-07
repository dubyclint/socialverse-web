import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

/**
 * Tags the root element with the running platform so CSS can apply native-only
 * behaviour, and routes native deep links back into vue-router.
 */
export default defineNuxtPlugin(() => {
  const platform = Capacitor.getPlatform()
  const root = document.documentElement

  root.classList.remove('platform-web', 'platform-android', 'platform-ios', 'platform-electron')
  root.classList.add(`platform-${platform}`)
  if (Capacitor.isNativePlatform()) root.classList.add('platform-native')

  if (!Capacitor.isNativePlatform()) return

  const router = useRouter()
  const config = useRuntimeConfig()
  const appDomain = String(config.public.appDomain || '')

  CapacitorApp.addListener('appUrlOpen', (event) => {
    try {
      const url = new URL(event.url)
      const isOwnDomain = appDomain ? url.host === new URL(appDomain).host : false
      const isCustomScheme = url.protocol.startsWith('viorp')
      if (!isOwnDomain && !isCustomScheme) return

      const target = `${url.pathname}${url.search}${url.hash}` || '/'
      router.push(target)
    } catch {
      // Ignore malformed deep links rather than crashing the shell.
    }
  })

  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) router.back()
    else CapacitorApp.exitApp()
  })
})
