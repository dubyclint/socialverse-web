// ============================================================================
// FILE: /middleware/language-check.ts - LOCALIZATION GUARD
// ============================================================================

export default defineNuxtRouteMiddleware((to: any) => {
  // 1. Safety Guard for undefined route
  if (!to || !to.path) return

  // 2. Language detection logic
  // Use Nuxt's i18n context or your custom plugin
  // The translation plugin is client-only, so `$i18n` is absent during SSR.
  const i18n = useNuxtApp().$i18n as { locale?: { value?: string } } | undefined
  const detectedLang = i18n?.locale?.value
  if (!detectedLang) return

  const path = to.path

  // Prevent redirect loops if already on the correct language path
  if (path.startsWith(`/${detectedLang}/`)) return

  // Optional: If you want to force language prefixes for SEO
  // const newPath = `/${detectedLang}${path === '/' ? '' : path}`
  // return navigateTo(newPath)
})
