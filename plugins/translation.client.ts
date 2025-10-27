export default defineNuxtPlugin(async (nuxtApp) => {
  console.log('[Plugin] Translation plugin initializing...')
  
  try {
    const { loadTranslations, detectBrowserLanguage, t, setLanguage, getCurrentLang } = await import('~/composables/useI18n')
    
    // Detect and load browser language on client
    const browserLang = detectBrowserLanguage()
    
    try {
      await loadTranslations(browserLang)
      console.log('[Plugin] Translation plugin initialized successfully')
    } catch (err) {
      console.warn('[Plugin] Failed to load translations, using defaults:', err)
      // Continue without translations - don't break the app
    }
    
    // Provide translation utilities globally
    return {
      provide: {
        t,
        setLanguage,
        getCurrentLang,
      },
    }
  } catch (err) {
    console.error('[Plugin] Translation plugin initialization failed:', err)
    // Provide dummy translation functions so app doesn't break
    return {
      provide: {
        t: (key: string, defaultValue?: string) => defaultValue || key,
        setLanguage: async () => {},
        getCurrentLang: () => 'en',
      },
    }
  }
})
