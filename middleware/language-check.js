// FILE: /middleware/language-check.ts - LANGUAGE PREFERENCE
// ============================================================================
// GLOBAL MIDDLEWARE - Applied to all routes
// Purpose: Set user's language preference based on URL, user settings, or browser
// ============================================================================

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server-side rendering
  if (process.server) return

  try {
    const { locale, setLocale } = useI18n()
    
    // Supported languages
    const supportedLanguages = ['en', 'fr', 'es', 'de']

    // 1. Check for language preference in URL query parameter
    const urlLang = to.query.lang as string
    if (urlLang && supportedLanguages.includes(urlLang)) {
      console.log(`[Language Middleware] Setting language from URL: ${urlLang}`)
      setLocale(urlLang)
      return
    }

    // 2. Check user's saved language preference from localStorage
    const savedLang = typeof window !== 'undefined' 
      ? localStorage.getItem('user_language') 
      : null

    if (savedLang && supportedLanguages.includes(savedLang)) {
      if (savedLang !== locale.value) {
        console.log(`[Language Middleware] Setting language from localStorage: ${savedLang}`)
        setLocale(savedLang)
      }
      return
    }

    // 3. Try to get language from Supabase user metadata (if authenticated)
    try {
      const user = useSupabaseUser()
      if (user.value?.user_metadata?.preferred_language) {
        const userLang = user.value.user_metadata.preferred_language
        if (supportedLanguages.includes(userLang) && userLang !== locale.value) {
          console.log(`[Language Middleware] Setting language from user metadata: ${userLang}`)
          setLocale(userLang)
          return
        }
      }
    } catch (error) {
      console.log(`[Language Middleware] Could not get Supabase user`)
    }

    // 4. Detect browser language
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.split('-')[0]
      if (supportedLanguages.includes(browserLang) && browserLang !== locale.value) {
        console.log(`[Language Middleware] Setting language from browser: ${browserLang}`)
        setLocale(browserLang)
      }
    }

    console.log(`[Language Middleware] Current language: ${locale.value}`)
  } catch (error) {
    console.error(`[Language Middleware] Error:`, error)
    // Don't block navigation on language errors
  }
})
