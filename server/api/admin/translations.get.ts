// ============================================================================
// server/api/admin/translations.get.ts - ADMIN TRANSLATIONS GET ENDPOINT
// ============================================================================
// ✅ FIXED: Properly handles GET requests for translations
// Returns translations from database or empty array for fallback

export default defineEventHandler(async (event) => {
  try {
    const { lang } = getQuery(event)
    const language = (lang as string) || 'en'
    
    console.log('[Translations API] GET request for language:', language)
    
    try {
      const supabase = await serverSupabaseClient(event)
      
      if (!supabase) {
        console.warn('[Translations API] Supabase client not available')
        return []
      }
      
      const { data, error } = await supabase
        .from('translations')
        .select('key, value')
        .eq('language', language)
      
      if (error) {
        console.error('[Translations API] Query error:', error)
        // Return empty array to trigger fallback to local files
        return []
      }
      
      if (!data || !Array.isArray(data)) {
        console.warn('[Translations API] Unexpected data format:', typeof data)
        return []
      }
      
      console.log('[Translations API] Loaded', data.length, 'translations for language:', language)
      return data
      
    } catch (dbError) {
      console.error('[Translations API] Database error:', dbError)
      // Return empty array to trigger fallback to local files
      return []
    }
    
  } catch (error) {
    console.error('[Translations API] Request error:', error)
    // Return empty array instead of throwing error
    // This allows the app to fall back to local translations
    return []
  }
})
