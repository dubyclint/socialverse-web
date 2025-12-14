// FILE: /middleware/language-check.ts (CORRECTED)
// ============================================================================
// LANGUAGE CHECK MIDDLEWARE - FIXED: Proper imports and error handling
// ============================================================================

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip on server-side
  if (process.server) return

  try {
    // Check if i18n is available
    const { locale } = useI18n()
    
    if (!locale) {
      console.warn('[Language Middleware] i18n not available, using default locale')
      return
    }

    // Get browser language
    const browserLang = typeof navigator !== 'undefined' 
      ? navigator?.language?.split('-')[0] || 'en'
      : 'en'
    
    // Set locale if not already set
    if (!locale.value) {
      locale.value = browserLang
      console.log('[Language Middleware] Set locale to:', locale.value)
    }
  } catch (error) {
    console.warn('[Language Middleware] Could not set locale:', error)
    // Don't block navigation if i18n fails
  }
})
