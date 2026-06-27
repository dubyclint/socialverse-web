export default defineNuxtRouteMiddleware((to, from) => {
  // Skip on server-side
  if (process.server) {
    console.log('[Language Middleware] Running on server - skipping')
    return
  }

  try {
    // Get stored language from localStorage directly (no useStorage needed)
    const storedLang = localStorage.getItem('i18n_language')
    
    if (storedLang) {
      console.log('[Language Middleware] ✅ Using stored language:', storedLang)
      return
    }

    // Detect browser language as fallback
    const browserLang = navigator.language?.split('-')[0] || 'en'
    const supportedLangs = ['en', 'es', 'fr', 'de', 'zh', 'ja']
    const detectedLang = supportedLangs.includes(browserLang) ? browserLang : 'en'

    console.log('[Language Middleware] ✅ Detected browser language:', detectedLang)
    
    // Store detected language directly to localStorage
    localStorage.setItem('i18n_language', detectedLang)
    
  } catch (err) {
    console.error('[Language Middleware] ❌ Error:', err)
  }
})
