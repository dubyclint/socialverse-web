// ============================================================================
// server/api/admin/translations.ts - ADMIN TRANSLATIONS ENDPOINT (FIXED)
// ============================================================================
// ✅ FIXED: Properly handles GET requests for translations
// Returns translations from database or empty array for fallback

export default defineEventHandler(async (event) => {
  const method = event.req.method
  
  if (method === 'GET') {
    try {
      const { lang } = getQuery(event)
      const language = (lang as string) || 'en'
      
      console.log('[Translations] GET request for language:', language)
      
      try {
        const supabase = await serverSupabaseClient(event)
        
        const { data, error } = await supabase
          .from('translations')
          .select('key, value')
          .eq('language', language)
        
        if (error) {
          console.error('[Translations] Query error:', error)
          // Return empty array to trigger fallback to local files
          return []
        }
        
        if (!data || !Array.isArray(data)) {
          console.warn('[Translations] Unexpected data format:', typeof data)
          return []
        }
        
        console.log('[Translations] Loaded', data.length, 'translations for language:', language)
        return data
        
      } catch (dbError) {
        console.error('[Translations] Database error:', dbError)
        // Return empty array to trigger fallback to local files
        return []
      }
      
    } catch (error) {
      console.error('[Translations] Request error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to load translations',
      })
    }
  }
  
  if (method === 'POST') {
    try {
      const body = await readBody(event)
      const { lang, translations } = body
      
      if (!lang || !translations) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Missing lang or translations in request body',
        })
      }
      
      console.log('[Translations] POST request for language:', lang)
      
      try {
        const supabase = await serverSupabaseClient(event)
        
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
          console.error('[Translations] Upsert error:', error)
          throw createError({
            statusCode: 500,
            statusMessage: 'Failed to save translations',
          })
        }
        
        console.log('[Translations] Saved', translations.length, 'translations for language:', lang)
        return { success: true, count: translations.length }
        
      } catch (dbError) {
        console.error('[Translations] Database error:', dbError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Database error',
        })
      }
      
    } catch (error) {
      console.error('[Translations] Request error:', error)
      throw error
    }
  }
  
  // Method not allowed
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  })
})
