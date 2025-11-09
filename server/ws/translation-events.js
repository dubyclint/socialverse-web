// server/ws/translationEvents.js - TRANSLATION EVENTS HANDLER
// ==============================================================

const { supabase } = require('../utils/supabase');

class TranslationEvents {
  static setupTranslationEvents(io, socket) {
    // ===== TRANSLATE MESSAGE =====
    socket.on('message:translate', async (data) => {
      try {
        const { messageId, text, targetLang, chatId } = data;
        const userId = socket.userId;

        // Call translation API
        const translatedText = await translateText(text, targetLang);

        // Cache translation in Supabase
        const { data: translation, error: cacheError } = await supabase
          .from('message_translations')
          .insert({
            message_id: messageId,
            original_text: text,
            translated_text: translatedText,
            target_language: targetLang,
            user_id: userId,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
          .catch(err => {
            console.error('Cache translation error:', err);
            return { data: null, error: err };
          });

        // Broadcast translation to chat room
        io.to(`chat:${chatId}`).emit('message:translated', {
          messageId,
          translatedText,
          targetLang,
          userId,
          timestamp: new Date().toISOString()
        });

        // Acknowledge to sender
        socket.emit('translation:success', {
          messageId,
          translatedText,
          targetLang
        });

      } catch (error) {
        console.error('Translation error:', error);
        socket.emit('translation:error', {
          message: 'Failed to translate message'
        });
      }
    });

    // ===== GET CACHED TRANSLATION =====
    socket.on('translation:get-cached', async (data) => {
      try {
        const { messageId, targetLang } = data;

        const { data: translation, error } = await supabase
          .from('message_translations')
          .select('translated_text')
          .eq('message_id', messageId)
          .eq('target_language', targetLang)
          .single();

        if (error || !translation) {
          socket.emit('translation:cached', { translatedText: null });
          return;
        }

        socket.emit('translation:cached', {
          translatedText: translation.translated_text
        });

      } catch (error) {
        console.error('Get cached translation error:', error);
        socket.emit('translation:cached', { translatedText: null });
      }
    });

    // ===== GET TRANSLATION HISTORY =====
    socket.on('translation:get-history', async (data) => {
      try {
        const userId = socket.userId;
        const { limit = 20, offset = 0 } = data;

        const { data: translations, error } = await supabase
          .from('message_translations')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          socket.emit('translation:history', { translations: [] });
          return;
        }

        socket.emit('translation:history', {
          translations: translations || []
        });

      } catch (error) {
        console.error('Get translation history error:', error);
        socket.emit('translation:history', { translations: [] });
      }
    });
  }
}

// Helper function to translate text
async function translateText(text, targetLang) {
  try {
    // TODO: Implement with actual translation service
    // Options:
    // 1. Google Translate API
    // 2. DeepL API
    // 3. Microsoft Translator
    // 4. AWS Translate

    // For now, return placeholder
    // Example with google-translate-api-x:
    // const translate = require('google-translate-api-x');
    // const result = await translate(text, { to: targetLang });
    // return result.text;

    // Placeholder
    return `[Translated to ${targetLang}]: ${text}`;
  } catch (error) {
    console.error('Translation service error:', error);
    throw new Error('Translation service unavailable');
  }
}

module.exports = TranslationEvents;
