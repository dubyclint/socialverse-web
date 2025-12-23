// ============================================================================
// FILE 3: /middleware/language-check.ts - COMPLETE FIXED VERSION
// ============================================================================
// ✅ FIXED: Removed useI18n from middleware (composables not available in middleware)
// ✅ FIXED: Using localStorage for language persistence
// ✅ FIXED: Proper client-side only execution
// ✅ FIXED: Better error handling and logging
// ============================================================================

export default defineNuxtRouteMiddleware((to, from) => {
  // ============================================================================
  // SKIP ON SERVER-SIDE
  // ============================================================================
  if (process.server) {
    console.log('[Language Middleware] Running on server - skipping')
    return
  }

  try {
    // ============================================================================
    // ONLY RUN ON CLIENT-SIDE
    // ============================================================================
    if (!process.client) {
      console.log('[Language Middleware] Not on client - skipping')
      return
    }

    // ============================================================================
    // CHECK IF LOCALSTORAGE IS AVAILABLE
    // ============================================================================
    if (typeof localStorage === 'undefined') {
      console.warn('[Language Middleware] ⚠️ localStorage not available')
      return
    }

    // ============================================================================
    // GET STORED LANGUAGE OR DETECT BROWSER LANGUAGE
    // ============================================================================
    const storedLang = localStorage.getItem('app-language')
    
    if (storedLang) {
      console.log('[Language Middleware] ✅ Using stored language:', storedLang)
      return
    }

    // ============================================================================
    // DETECT BROWSER LANGUAGE
    // ============================================================================
    const browserLang = typeof navigator !== 'undefined' 
      ? (navigator?.language || navigator?.userLanguage || 'en').split('-')[0]
      : 'en'

    // ============================================================================
    // VALIDATE LANGUAGE CODE
    // ============================================================================
    const supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']
    const finalLang = supportedLanguages.includes(browserLang) ? browserLang : 'en'

    // ============================================================================
    // STORE LANGUAGE IN LOCALSTORAGE
    // ============================================================================
    localStorage.setItem('app-language', finalLang)
    console.log('[Language Middleware] ✅ Set language to:', finalLang)

  } catch (error) {
    console.warn('[Language Middleware] ⚠️ Error setting language:', error)
    // Continue anyway - app should work without language middleware
  }
})
