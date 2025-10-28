export default defineNuxtPlugin(async (nuxtApp) => {
  console.log('[Plugin] Translation plugin initializing...')
  
  try {
    const { loadTranslations, detectBrowserLanguage, t, setLanguage, getCurrentLang } = await import('~/composables/useI18n')
    
    const browserLang = detectBrowserLanguage()
    
    // ✅ CRITICAL: Load translations in background, don't block app initialization
    loadTranslations(browserLang).catch((err) => {
      console.warn('[Plugin] Failed to load translations in background:', err)
      // Continue anyway - app should work without translations
    })
    
    console.log('[Plugin] Translation plugin initialized successfully')
    
    return {
      provide: {
        t: (key: string, defaultValue?: string) => t(key, defaultValue || key),
        setLanguage,
        getCurrentLang,
      },
    }
  } catch (err) {
    console.error('[Plugin] Translation plugin initialization failed:', err)
    // ✅ CRITICAL: Provide safe fallback functions so app doesn't break
    return {
      provide: {
        t: (key: string, defaultValue?: string) => defaultValue || key,
        setLanguage: async () => {},
        getCurrentLang: () => 'en',
      },
    }
  }
})
