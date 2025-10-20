import { ref } from 'vue'

export const currentLang = ref('en')
export const translations = ref<Record<string, string>>({})

/**
 * Load translations for a given language.
 * Falls back to English if none are found.
 */
export async function loadTranslations(lang: string) {
  try {
    const res = await fetch(`/api/admin/translations?lang=${lang}`)
    const entries = await res.json()

    if (!entries.length && lang !== 'en') {
      return loadTranslations('en')
    }

    translations.value = Object.fromEntries(entries.map(e => [e.key, e.value]))
    currentLang.value = lang
  } catch (err) {
    console.error('Translation load failed:', err)
    await loadTranslations('en')
  }
}

/**
 * Translate a given key.
 */
export function t(key: string): string {
  return translations.value[key] || key
}

/**
 * Detect language from browser settings.
 */
export async function detectBrowserLanguage() {
  const lang = navigator.language?.split('-')[0] || 'en'
  await loadTranslations(lang)
}

/**
 * Detect language from IP via backend.
 */
export async function detectIPLanguage() {
  try {
    const res = await fetch('/api/user/languageDetect')
    const { language } = await res.json()
    await loadTranslations(language)
  } catch (err) {
    console.warn('IP language detection failed:', err)
    await loadTranslations('en')
  }
}
