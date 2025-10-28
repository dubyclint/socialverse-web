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
        
      } catch (supabaseErr) {
        console.error('[Translations] Supabase error:', supabaseErr)
        return []
      }
      
    } catch (err) {
      console.error('[Translations] GET Error:', err)
      return []
    }
  }

  if (method === 'POST') {
    try {
      const supabase = await serverSupabaseClient(event)
      const entry = await readBody(event)
      
      const { data, error } = await supabase
        .from('translations')
        .insert([entry])
        .select()
      
      if (error) {
        console.error('[Translations] Insert error:', error)
        throw error
      }
      
      return data?.[0] || entry
    } catch (err) {
      console.error('[Translations] POST Error:', err)
      throw err
    }
  }

  return { error: 'Method not allowed' }
})

