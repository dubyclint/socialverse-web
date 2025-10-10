
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('translation', useTranslation())
})
 
