// ============================================================================
// server/api/admin/translations.post.ts - ADMIN TRANSLATIONS POST ENDPOINT
// ============================================================================
// ✅ FIXED: Properly handles POST requests for saving translations

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { lang, translations } = body
    
    if (!lang || !translations) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing lang or translations in request body',
      })
    }
    
    console.log('[Translations API] POST request for language:', lang)
    
    try {
      const supabase = await serverSupabaseClient(event)
      
      if (!supabase) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Supabase client not available',
        })
      }
      
      // Upsert translations
      const { error } = await supabase
        .from('translations')
        .upsert(
          translations.map((t: any) => ({
            language: lang,
            key: t.key,
            value: t.value,
          })),
          { onConflict: 'language,key' }
        )
      
      if (error) {
        console.error('[Translations API] Upsert error:', error)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to save translations',
        })
      }
      
      console.log('[Translations API] Saved', translations.length, 'translations for language:', lang)
      return { success: true, count: translations.length }
      
    } catch (dbError) {
      console.error('[Translations API] Database error:', dbError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Database error',
      })
    }
    
  } catch (error) {
    console.error('[Translations API] Request error:', error)
    throw error
  }
})
