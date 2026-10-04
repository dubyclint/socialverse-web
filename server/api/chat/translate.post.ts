// ============================================================================
// FILE: /server/api/chat/translate.post.ts
// COMPLETE PRODUCTION IMPLEMENTATION
// ============================================================================
// POST /api/chat/translate - Translate message content
//
// Request Body:
//   {
//     text: string (required) - text to translate
//     targetLanguage: string (required) - target language code (e.g., 'en', 'es', 'fr')
//     sourceLanguage?: string (optional) - source language code, auto-detect if omitted
//   }
//
// Response:
//   {
//     success: boolean
//     data: {
//       original: string
//       translated: string
//       sourceLanguage: string
//       targetLanguage: string
//     }
//     message: string
//   }
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'
import type { H3Event } from 'h3'
import { requireUser } from '~/server/utils/auth'

interface TranslateRequest {
  text: string
  targetLanguage: string
  sourceLanguage?: string
}

interface TranslateResponse {
  success: boolean
  data?: {
    original: string
    translated: string
    sourceLanguage: string
    targetLanguage: string
  }
  message: string
}

export default defineEventHandler(async (event: H3Event): Promise<TranslateResponse> => {
  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================
    const authUser = await requireUser(event)
    const userId = authUser?.id

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - User not authenticated'
      })
    }

    // ========================================================================
    // 2. PARSE REQUEST BODY
    // ========================================================================
    const body = await readBody(event) as TranslateRequest

    if (!body.text || !body.targetLanguage) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: text, targetLanguage'
      })
    }

    const text = String(body.text).trim()
    const targetLanguage = String(body.targetLanguage).toLowerCase()
    const sourceLanguage = body.sourceLanguage ? String(body.sourceLanguage).toLowerCase() : 'auto'

    if (text.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Text cannot be empty'
      })
    }

    if (text.length > 5000) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Text exceeds maximum length of 5000 characters'
      })
    }

    // ========================================================================
    // 3. INITIALIZE SUPABASE CLIENT
    // ========================================================================
    const supabase = await serverSupabaseClient(event)

    // ========================================================================
    // 4. CALL TRANSLATION SERVICE
    // ========================================================================
    let translatedText = ''
    let detectedSourceLanguage = sourceLanguage

    try {
      const translationResult = await translateText(text, sourceLanguage, targetLanguage)
      translatedText = translationResult.translated
      detectedSourceLanguage = translationResult.sourceLanguage
    } catch (translationError: unknown) {
      if ((translationError as { statusCode?: number })?.statusCode === 503) throw translationError
      console.error('[Translate API] Translation service error:', translationError)
      throw createError({
        statusCode: 503,
        statusMessage: 'Translation service unavailable'
      })
    }

    // ========================================================================
    // 5. LOG TRANSLATION (optional - for analytics)
    // ========================================================================
    try {
      await supabase
        .from('translation_logs')
        .insert({
          user_id: userId,
          original_text: text,
          translated_text: translatedText,
          source_language: detectedSourceLanguage,
          target_language: targetLanguage
        })
    } catch (logError) {
      console.warn('[Translate API] Failed to log translation:', logError)
      // Continue - logging is not critical
    }

    // ========================================================================
    // 6. RETURN RESPONSE
    // ========================================================================
    return {
      success: true,
      data: {
        original: text,
        translated: translatedText,
        sourceLanguage: detectedSourceLanguage,
        targetLanguage
      },
      message: 'Text translated successfully'
    }

  } catch (error: any) {
    // If it's already a createError, re-throw it
    if (error?.statusCode) {
      throw error
    }

    // Log unexpected errors
    console.error('[Translate API] Unexpected error:', error)

    // Return generic 500 error
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})
