// ============================================================================
// FILE: /server/api/translate.post.ts - FIXED WITH LAZY LOADING
// ============================================================================

import { defineEventHandler, readBody, createError } from 'h3'

// Lazy load translation library
let translate: any = null;
let detect: any = null;

async function getTranslateAPI() {
  if (!translate) {
    try {
      const module = await import('@vitalets/google-translate-api');
      translate = module.translate;
      detect = module.detect;
    } catch (error) {
      console.error('[Translate] Failed to load translation API:', error);
      throw error;
    }
  }
  return { translate, detect };
}

// Define request body interface
interface TranslationRequestBody {
  text: string
  targetLang: string
  contentId: string
}

// Simple in-memory cache for translations
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
  const cacheKey = `${contentId}:${targetLang}`;
  translationCache.set(cacheKey, {
    text: translatedText,
    timestamp: Date.now()
  });
}

/**
 * Get cached translation
 */
function getCachedTranslation(contentId: string, targetLang: string): string | null {
  const cacheKey = `${contentId}:${targetLang}`;
  const cached = translationCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.text;
  }
  
  return null;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<TranslationRequestBody>(event);
    const { text, targetLang, contentId } = body;

    if (!text || !targetLang) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields: text and targetLang'
      });
    }

    // Check cache first
    if (contentId) {
      const cached = getCachedTranslation(contentId, targetLang);
      if (cached) {
        return {
          success: true,
          translatedText: cached,
          cached: true
        };
      }
    }

    // Load translation API
    const { translate } = await getTranslateAPI();

    // Perform translation
    const result = await translate(text, { to: targetLang });
    const translatedText = result.text;

    // Cache the result
    if (contentId) {
      await cacheTranslation(contentId, targetLang, translatedText);
    }

    return {
      success: true,
      translatedText,
      cached: false
    };
  } catch (error) {
    console.error('[Translate] Translation failed:', error);
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Translation failed'
    });
  }
});
