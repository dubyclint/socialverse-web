// utils/translation.cache.ts

const translationCache = new Map<string, string>()

export const cacheTranslation = (contentId: string, targetLang: string, translatedText: string): void => {
  const cacheKey = `${contentId}_${targetLang}`
  translationCache.set(cacheKey, translatedText)
}

export const getCachedTranslation = (contentId: string, targetLang: string): string | undefined => {
  const cacheKey = `${contentId}_${targetLang}`
  return translationCache.get(cacheKey)
}

export const clearTranslationCache = (): void => {
  translationCache.clear()
}
