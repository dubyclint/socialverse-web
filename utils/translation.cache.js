
const translationCache = new Map()

export const cacheTranslation = (contentId, targetLang, translatedText) => {
  const cacheKey = `${contentId}_${targetLang}`
  translationCache.set(cacheKey, translatedText)
}

export const getCachedTranslation = (contentId, targetLang) => {
  const cacheKey = `${contentId}_${targetLang}`
  return translationCache.get(cacheKey)
}
 
