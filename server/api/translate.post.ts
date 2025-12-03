// ============================================================================
// FILE 2: /server/api/translate.post.ts - FIXED VERSION
// ============================================================================
// TRANSLATION API ENDPOINT - FIXED: Replaced placeholder with real service
// ============================================================================

import { defineEventHandler, readBody, createError } from 'h3'

// FIXED: Replace 'some-translation-service' with actual translation package
// Option 1: Using google-translate-api-x (lightweight, no API key needed)
import { translate, detect } from 'google-translate-api-x'

// Define request body interface
interface TranslationRequestBody {
  text: string
  targetLang: string
  contentId: string
}

// Define expected shape of detect() return value
interface LanguageDetectionResult {
  language: string // e.g., 'en', 'es', 'fr'
  confidence?: number
}

// Simple in-memory cache for translations (replace with Redis in production)
const translationCache = new Map<string, { text: string; timestamp: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Cache translation result
 */
async function cacheTranslation(
  contentId: string,
  targetLang: string,
  translatedText: string
): Promise<void> {
  try {
    const key = `${contentId}:${targetLang}`
    translationCache.set(key, {
      text: translatedText,
      timestamp: Date.now()
    })
    console.log(`[Translation] Cached translation for ${contentId} -> ${targetLang}`)
  } catch (error) {
    console.error('[Translation] Cache error:', error)
    // Don't throw - caching failure shouldn't block translation
  }
}

/**
 * Get cached translation
 */
function getCachedTranslation(contentId: string, targetLang: string): string | null {
  try {
    const key = `${contentId}:${targetLang}`
    const cached = translationCache.get(key)
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Translation] Cache hit for ${contentId} -> ${targetLang}`)
      return cached.text
    }
    
    // Remove expired entry
    if (cached) {
      translationCache.delete(key)
    }
    
    return null
  } catch (error) {
    console.error('[Translation] Cache retrieval error:', error)
    return null
  }
}

/**
 * Main translation handler
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Validate required fields
    if (!body?.text || !body?.targetLang || !body?.contentId) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields: text, targetLang, or contentId'
      })
    }

    const { text, targetLang, contentId } = body as TranslationRequestBody

    // Validate text length
    if (text.length > 5000) {
      throw createError({
        statusCode: 400,
        message: 'Text exceeds maximum length of 5000 characters'
      })
    }

    // Check cache first
    const cachedResult = getCachedTranslation(contentId, targetLang)
    if (cachedResult) {
      return {
        translatedText: cachedResult,
        fromCache: true
      }
    }

    // Detect source language automatically
    const detectionResult = await detect(text)
    const sourceLang = (detectionResult as any).language || 'en'

    console.log(`[Translation] Detected language: ${sourceLang}, translating to: ${targetLang}`)

    // Skip translation if source and target are the same
    if (sourceLang === targetLang) {
      await cacheTranslation(contentId, targetLang, text)
      return {
        translatedText: text,
        fromCache: false,
        skipped: true
      }
    }

    // Get translation
    const translationResult = await translate(text, {
      from: sourceLang,
      to: targetLang
    })

    const translatedText: string = (translationResult as any).text || text

    // Cache the translation
    await cacheTranslation(contentId, targetLang, translatedText)

    return {
      translatedText,
      fromCache: false,
      sourceLang,
      targetLang
    }
  } catch (error: unknown) {
    console.error('[Translation] Error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Translation failed'
    
    throw createError({
      statusCode: 500,
      message: errorMessage
    })
  }
})

// ============================================================================
// ALTERNATIVE IMPLEMENTATIONS
// ============================================================================

/*
// Option 2: Using @google-cloud/translate (requires API key)
import { Translate } from '@google-cloud/translate/build/src/index.js'

const translate = new Translate({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
})

// Then in the handler:
const [translatedText] = await translate.translate(text, targetLang)

// Option 3: Using AWS Translate
import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate'

const translateClient = new TranslateClient({ region: process.env.AWS_REGION })

// Then in the handler:
const command = new TranslateTextCommand({
  Text: text,
  SourceLanguageCode: sourceLang,
  TargetLanguageCode: targetLang
})
const response = await translateClient.send(command)
const translatedText = response.TranslatedText
*/
