// ============================================================================
// server/api/translations.get.ts - TRANSLATIONS GET ENDPOINT (SIMPLIFIED)
// ============================================================================
// ✅ FIXED: Simple endpoint that returns empty array as fallback
// This allows the app to use local translations without errors

export default defineEventHandler(async (event) => {
  try {
    const { lang } = getQuery(event)
    const language = (lang as string) || 'en'
    
    console.log('[Translations API] GET request for language:', language)
    
    // ✅ Try to get from Supabase, but don't fail if unavailable
    try {
      const supabase = await serverSupabaseClient(event)
      
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('translations')
            .select('key, value')
            .eq('language', language)
          
          if (!error && data && Array.isArray(data) && data.length > 0) {
            console.log('[Translations API] Loaded', data.length, 'translations from Supabase for language:', language)
            return data
          }
        } catch (queryError) {
          console.warn('[Translations API] Supabase query error:', queryError)
        }
      }
    } catch (supabaseError) {
      console.warn('[Translations API] Supabase client error:', supabaseError)
    }
    
    // ✅ Fallback: return empty array to trigger local file loading
    console.log('[Translations API] Returning empty array - will use local translations')
    return []
    
  } catch (error) {
    console.error('[Translations API] Unexpected error:', error)
    // ✅ Always return empty array, never throw
    return []
  }
})
