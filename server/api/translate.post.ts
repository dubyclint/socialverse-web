// ============================================================================
// FILE: /server/api/translate.post.ts - CORRECTED VERSION
// ============================================================================
// TRANSLATION API ENDPOINT
// FIXED: Uses @vitalets/google-translate-api (verified package)
// ============================================================================

import { defineEventHandler, readBody, createError } from 'h3'
import { translate, detect } from '@vitalets/google-translate-api'

// Define request body interface
interface TranslationRequestBody {
  text: string
  targetLang: string
  contentId: string
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

    console.log(`[Translation] Translating to: ${targetLang}`)

    try {
      // Detect source language automatically
      const detectionResult = await detect(text)
      const sourceLang = (detectionResult as any).language || 'en'

      console.log(`[Translation] Detected language: ${sourceLang}`)

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
    } catch (translationError) {
      console.error('[Translation] Translation service error:', translationError)
      
      // Fallback: return original text if translation fails
      console.log('[Translation] Falling back to original text')
      await cacheTranslation(contentId, targetLang, text)
      
      return {
        translatedText: text,
        fromCache: false,
        fallback: true,
        error: 'Translation service temporarily unavailable'
      }
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
// Option 1: Using libre-translate (self-hosted or API)
import axios from 'axios'

const LIBRE_TRANSLATE_API = process.env.LIBRE_TRANSLATE_API || 'http://localhost:5000'

async function libreTranslate(text: string, targetLang: string) {
  const response = await axios.post(`${LIBRE_TRANSLATE_API}/translate`, {
    q: text,
    target: targetLang,
    format: 'text'
  })
  return response.data.translatedText
}

// Option 2: Using AWS Translate
import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate'

const translateClient = new TranslateClient({ region: process.env.AWS_REGION })

async function awsTranslate(text: string, sourceLang: string, targetLang: string) {
  const command = new TranslateTextCommand({
    Text: text,
    SourceLanguageCode: sourceLang,
    TargetLanguageCode: targetLang
  })
  const response = await translateClient.send(command)
  return response.TranslatedText
}

// Option 3: Using @google-cloud/translate (requires API key)
import { Translate } from '@google-cloud/translate/build/src/index.js'

const googleTranslate = new Translate({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
})

async function googleCloudTranslate(text: string, targetLang: string) {
  const [translatedText] = await googleTranslate.translate(text, targetLang)
  return translatedText
}
*/
