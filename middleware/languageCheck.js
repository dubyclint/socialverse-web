
export default defineNuxtRouteMiddleware(() => {
  const { detectTranslationNeed } = useTranslation()
  detectTranslationNeed()
})
 
