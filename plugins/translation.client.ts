export default defineNuxtPlugin(async (nuxtApp) => {
  const { loadTranslations, detectBrowserLanguage, t, setLanguage, getCurrentLang } = await import('~/composables/useI18n')
  
  // Detect and load browser language on client
  const browserLang = detectBrowserLanguage()
  await loadTranslations(browserLang)
  
  // Provide translation utilities globally
  return {
    provide: {
      t,
      setLanguage,
      getCurrentLang,
    },
  }
})

