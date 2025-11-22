// server/api/translate.post.ts
import { defineEventHandler, readBody, createError } from 'h3';
import { detect, translate } from 'some-translation-service'; // Replace with your actual translation SDK

// Define request body interface
interface TranslationRequestBody {
  text: string;
  targetLang: string;
  contentId: string;
}

// Define expected shape of detect() return value (adjust based on your SDK)
interface LanguageDetectionResult {
  language: string; // e.g., 'en', 'es', 'fr'
  // Add other fields if your detection returns more (e.g., confidence)
}

// Mock or import your caching function with proper typing
async function cacheTranslation(
  contentId: string,
  targetLang: string,
  translatedText: string
): Promise<void> {
  // Your caching implementation (e.g., Redis, DB, etc.)
  // This is a placeholder — replace with your actual logic
  console.log(`Caching translation for ${contentId} -> ${targetLang}`);
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Validate required fields
  if (!body?.text || !body?.targetLang || !body?.contentId) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: text, targetLang, or contentId'
    });
  }

  const { text, targetLang, contentId } = body as TranslationRequestBody;

  try {
    // Detect source language automatically
    const detectionResult = await detect(text);
    const sourceLang = (detectionResult as LanguageDetectionResult).language;

    // Get translation
    const translatedText: string = await translate(text, {
      from: sourceLang,
      to: targetLang
    });

    // Cache the translation
    await cacheTranslation(contentId, targetLang, translatedText);

    return {
      translatedText
    };
  } catch (error: unknown) {
    console.error('Translation error:', error);
    throw createError({
      statusCode: 500,
      message: 'Translation failed'
    });
  }
});
