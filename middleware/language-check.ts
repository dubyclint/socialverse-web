export default defineNuxtRouteMiddleware((to, from) => {
  // Skip on server-side
  if (process.server) {
    console.log('[Language Middleware] Running on server - skipping')
    return
  }

  try {
    // Use storage manager instead of direct localStorage
    const storage = useStorage({ prefix: 'i18n_' })
    
    // Get stored language
    const storedLang = storage.get<string>('language')
    
    if (storedLang) {
      console.log('[Language Middleware] ✅ Using stored language:', storedLang)
      return
    }

    // Detect browser language as fallback
    const browserLang = navigator.language?.split('-')[0] || 'en'
    const supportedLangs = ['en', 'es', 'fr', 'de', 'zh', 'ja']
    const detectedLang = supportedLangs.includes(browserLang) ? browserLang : 'en'

    console.log('[Language Middleware] ✅ Detected browser language:', detectedLang)
    
    // Store detected language using storage manager
    storage.set('language', detectedLang)
    
  } catch (err) {
    console.error('[Language Middleware] ❌ Error:', err)
    // Continue anyway - app should work without language detection
  }
})
