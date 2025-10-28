export default defineNuxtPlugin(async (nuxtApp) => {
  console.log('[Plugin] Translation plugin initializing...')
  
  try {
    const { loadTranslations, detectBrowserLanguage, t, setLanguage, getCurrentLang } = await import('~/composables/useI18n')
    
    const browserLang = detectBrowserLanguage()
    
    try {
      await loadTranslations(browserLang)
      console.log('[Plugin] Translation plugin initialized successfully')
    } catch (err) {
      console.warn('[Plugin] Failed to load translations, using defaults:', err)
      // ✅ FIX: Don't break the app, continue with fallback
    }
    
    return {
      provide: {
        t: (key: string, defaultValue?: string) => t(key, defaultValue || key),
        setLanguage,
        getCurrentLang,
      },
    }
  } catch (err) {
    console.error('[Plugin] Translation plugin initialization failed:', err)
    // ✅ FIX: Provide safe fallback functions
    return {
      provide: {
        t: (key: string, defaultValue?: string) => defaultValue || key,
        setLanguage: async () => {},
        getCurrentLang: () => 'en',
      },
    }
  }
})
