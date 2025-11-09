// middleware/languageCheck.js
export default defineNuxtRouteMiddleware((to) => {
  const { locale, setLocale } = useI18n()
  const user = useSupabaseUser()
  
  // Check for language preference in URL
  const urlLang = to.query.lang
  if (urlLang && ['en', 'fr', 'es', 'de'].includes(urlLang)) {
    setLocale(urlLang)
    return
  }
  
  // Check user's saved language preference
  if (user.value?.user_metadata?.preferred_language) {
    const userLang = user.value.user_metadata.preferred_language
    if (userLang !== locale.value) {
      setLocale(userLang)
    }
  }
  
  // Detect translation needs for the current route
  const { detectTranslationNeed } = useTranslation()
  detectTranslationNeed()
})


