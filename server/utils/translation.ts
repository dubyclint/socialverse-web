export interface TranslationResult {
  translated: string
  sourceLanguage: string
  provider: 'google' | 'deepl' | 'libretranslate'
}

const json = async <T>(response: Response): Promise<T> => {
  if (!response.ok) throw new Error(`Translation provider error: ${response.status} ${response.statusText}`)
  return (await response.json()) as T
}

const google = async (key: string, text: string, source: string, target: string): Promise<TranslationResult> => {
  const data = await json<{ data: { translations: { translatedText: string; detectedSourceLanguage?: string }[] } }>(
    await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, target, source: source === 'auto' ? undefined : source, format: 'text' })
    })
  )
  const first = data.data.translations[0]
  if (!first) throw new Error('Translation provider returned no result')
  return { translated: first.translatedText, sourceLanguage: first.detectedSourceLanguage || source, provider: 'google' }
}

const deepl = async (key: string, text: string, source: string, target: string): Promise<TranslationResult> => {
  const host = key.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com'
  const data = await json<{ translations: { text: string; detected_source_language?: string }[] }>(
    await fetch(`${host}/v2/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `DeepL-Auth-Key ${key}` },
      body: JSON.stringify({
        text: [text],
        target_lang: target.toUpperCase(),
        source_lang: source === 'auto' ? undefined : source.toUpperCase()
      })
    })
  )
  const first = data.translations[0]
  if (!first) throw new Error('Translation provider returned no result')
  return {
    translated: first.text,
    sourceLanguage: first.detected_source_language?.toLowerCase() || source,
    provider: 'deepl'
  }
}

const libre = async (
  url: string,
  key: string | undefined,
  text: string,
  source: string,
  target: string
): Promise<TranslationResult> => {
  const data = await json<{ translatedText: string; detectedLanguage?: { language: string } }>(
    await fetch(`${url.replace(/\/$/, '')}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source, target, format: 'text', api_key: key || undefined })
    })
  )
  return {
    translated: data.translatedText,
    sourceLanguage: data.detectedLanguage?.language || source,
    provider: 'libretranslate'
  }
}

export const translationConfigured = (): boolean => {
  const config = useRuntimeConfig()
  return Boolean(config.googleTranslateApiKey || config.deeplApiKey || config.libretranslateUrl)
}

/** Translates through whichever provider is configured; throws 503 when none is. */
export const translateText = async (text: string, source: string, target: string): Promise<TranslationResult> => {
  const config = useRuntimeConfig()
  if (config.googleTranslateApiKey) return google(String(config.googleTranslateApiKey), text, source, target)
  if (config.deeplApiKey) return deepl(String(config.deeplApiKey), text, source, target)
  if (config.libretranslateUrl) {
    return libre(String(config.libretranslateUrl), config.libretranslateApiKey ? String(config.libretranslateApiKey) : undefined, text, source, target)
  }
  throw createError({ statusCode: 503, statusMessage: 'Translation is not configured yet' })
}
