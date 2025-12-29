 FIXED FILE 6: /middleware/language-check.ts
# ============================================================================
# LANGUAGE CHECK MIDDLEWARE - FIXED: Uses storage manager
# ============================================================================
# ✅ FIXED: Replaced direct localStorage with storage manager
# ✅ FIXED: Proper error handling
# ✅ FIXED: Client-side only execution
# ============================================================================

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
    // ✅ FIXED: Use storage manager instead of direct localStorage
    // ============================================================================
    const storage = useStorage({ prefix: 'i18n_' })
    
    // Get stored language
    const storedLang = storage.get<string>('language')
    
    if (storedLang) {
      console.log('[Language Middleware] ✅ Using stored language:', storedLang)
      return
    }

    // ============================================================================
    // DETECT BROWSER LANGUAGE AS FALLBACK
    // ============================================================================
    const browserLang = navigator.language?.split('-')[0] || 'en'
    const supportedLangs = ['en', 'es', 'fr', 'de', 'zh', 'ja']
    const detectedLang = supportedLangs.includes(browserLang) ? browserLang : 'en'

    console.log('[Language Middleware] ✅ Detected browser language:', detectedLang)
    
    // ✅ FIXED: Store detected language using storage manager
    storage.set('language', detectedLang)
    
  } catch (err) {
    console.error('[Language Middleware] ❌ Error:', err)
    // Continue anyway - app should work without language detection
  }
})
