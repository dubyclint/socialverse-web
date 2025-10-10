 
// composables/useTranslation.js
export const useTranslation = () => {
  const showTranslationButton = ref(false)
  const targetLanguage = ref('')
  
  const detectTranslationNeed = () => {
    const userLanguage = navigator.language.split('-')[0] // Get base language (e.g., 'en' from 'en-US')
    const storedLanguage = localStorage.getItem('userLanguage')
    
    if (storedLanguage && storedLanguage !== userLanguage) {
      showTranslationButton.value = true
      targetLanguage.value = userLanguage
    }
    // Add IP-based detection if needed
  }
  
  return { showTranslationButton, targetLanguage, detectTranslationNeed }
}
