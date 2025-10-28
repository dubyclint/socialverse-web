export default defineEventHandler(async (event) => {
  const method = event.req.method
  
  if (method === 'GET') {
    try {
      const { lang } = getQuery(event)
      
      console.log('[Translations] GET request for language:', lang || 'en')
      
      // ✅ FIX: Use Supabase instead of MongoDB
      const supabase = await serverSupabaseClient(event)
      
      const { data, error } = await supabase
        .from('translations')
        .select('key, value')  // ✅ Only select needed fields
        .eq('language', lang || 'en')
      
      if (error) {
        console.error('[Translations] Query error:', error)
        return []
      }
      
      console.log('[Translations] Loaded', data?.length || 0, 'translations for language:', lang)
      return data || []
      
    } catch (err) {
      console.error('[Translations] GET Error:', err)
      return []
    }
  }

  if (method === 'POST') {
    try {
      const supabase = await serverSupabaseClient(event)
      const entry = await readBody(event)

      console.log('[Translations] POST request for key:', entry.key, 'language:', entry.language)

      if (!entry.key || !entry.language || !entry.value) {
        console.error('[Translations] Missing required fields')
        return { success: false, message: 'Missing fields: key, language, value' }
      }

      entry.updated_at = new Date().toISOString()
      
      // ✅ FIX: Use upsert to handle both insert and update
      const { error } = await supabase
        .from('translations')
        .upsert(entry, { onConflict: 'key,language' })

      if (error) {
        console.error('[Translations] Upsert error:', error)
        return { success: false, message: error.message }
      }

      console.log('[Translations] Translation saved successfully')
      return { success: true, message: 'Translation saved.' }
      
    } catch (err) {
      console.error('[Translations] POST Error:', err)
      return { success: false, message: (err as any).message }
    }
  }

  // ✅ NEW: Handle DELETE method
  if (method === 'DELETE') {
    try {
      const supabase = await serverSupabaseClient(event)
      const { key, lang } = getQuery(event)

      console.log('[Translations] DELETE request for key:', key, 'language:', lang)

      if (!key || !lang) {
        return { success: false, message: 'Missing key or lang parameter' }
      }

      const { error } = await supabase
        .from('translations')
        .delete()
        .eq('key', key)
        .eq('language', lang)

      if (error) {
        console.error('[Translations] Delete error:', error)
        return { success: false, message: error.message }
      }

      console.log('[Translations] Translation deleted successfully')
      return { success: true, message: 'Translation deleted.' }
      
    } catch (err) {
      console.error('[Translations] DELETE Error:', err)
      return { success: false, message: (err as any).message }
    }
  }

  // ✅ NEW: Handle unsupported methods
  return {
    success: false,
    message: 'Method not supported. Use GET, POST, or DELETE.'
  }
})
