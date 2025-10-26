// server/api/chat/translate.post.ts - TRANSLATE MESSAGE IN CHAT
// ==============================================================

import { verifyAuth } from '../middleware/rbac'

export default defineEventHandler(async (event) => {
  try {
    const user = await verifyAuth(event, { requireAuth: true })
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const body = await readBody(event)
    const { text, targetLang, messageId, contentId } = body

    if (!text || !targetLang) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Text and target language are required'
      })
    }

    // Use translation service (Google Translate, DeepL, etc.)
    // This is a placeholder - implement with your chosen service
    const translatedText = await translateText(text, targetLang)

    // Cache translation in Supabase
    const supabase = await serverSupabaseClient(event)
    
    if (messageId) {
      await supabase
        .from('message_translations')
        .insert({
          message_id: messageId,
          original_text: text,
          translated_text: translatedText,
          target_language: targetLang,
          user_id: user.id,
          created_at: new Date().toISOString()
        })
        .catch(err => console.error('Cache translation error:', err))
    }

    return {
      success: true,
      data: {
        translatedText,
        sourceLang: 'auto',
        targetLang,
        messageId
      }
    }

  } catch (error) {
    console.error('Translation error:', error)
    throw error
  }
})

// Helper function to translate text
async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    // Example using Google Translate API
    // You need to set up your translation service
    
    // For now, return placeholder
    // TODO: Implement with actual translation service
    
    // Example with Google Translate:
    // const translate = require('google-translate-api-x');
    // const result = await translate(text, { to: targetLang });
    // return result.text;

    // Placeholder implementation
    return `[Translated to ${targetLang}]: ${text}`;
  } catch (error) {
    console.error('Translation service error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Translation service unavailable'
    });
  }
}

