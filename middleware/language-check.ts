// FILE: /middleware/language-check.ts (FIXED)
// ============================================================================
// LANGUAGE CHECK MIDDLEWARE - FIXED: Proper i18n initialization
// ============================================================================

export default defineRouteMiddleware(async (to, from) => {
  try {
    // Check if i18n is available
    const { locale } = useI18n()
    
    if (!locale) {
      console.warn('[Language Middleware] i18n not available, using default locale')
      return
    }

    // Get browser language
    const browserLang = navigator?.language?.split('-')[0] || 'en'
    
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
