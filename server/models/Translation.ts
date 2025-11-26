// FILE: /server/models/Translation.ts
// REFACTORED: Lazy-loaded Supabase

// ============================================================================
// LAZY-LOADED SUPABASE CLIENT
// ============================================================================
let supabaseInstance: any = null

async function getSupabase() {
  if (!supabaseInstance) {
    const { createClient } = await import('@supabase/supabase-js')
    supabaseInstance = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseInstance
}

// ============================================================================
// INTERFACES
// ============================================================================
export interface TranslationEntry {
  id: string
  key: string
  language: string
  value: string
  updatedAt: string
  updatedBy: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class TranslationModel {
  static async get(key: string, language: string): Promise<string | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('translations')
        .select('value')
        .eq('key', key)
        .eq('language', language)
        .single()

      if (error) {
        console.warn('[TranslationModel] Translation not found:', { key, language })
        return null
      }

      return data?.value || null
    } catch (error) {
      console.error('[TranslationModel] Error fetching translation:', error)
      throw error
    }
  }

  static async getAll(language: string): Promise<Record<string, string>> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('translations')
        .select('key, value')
        .eq('language', language)

      if (error) throw error

      const result: Record<string, string> = {}
      (data || []).forEach((entry: any) => {
        result[entry.key] = entry.value
      })

      return result
    } catch (error) {
      console.error('[TranslationModel] Error fetching all translations:', error)
      throw error
    }
  }

  static async set(key: string, language: string, value: string, updatedBy: string): Promise<TranslationEntry> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('translations')
        .upsert({
          key,
          language,
          value,
          updatedAt: new Date().toISOString(),
          updatedBy
        })
        .select()
        .single()

      if (error) throw error
      return data as TranslationEntry
    } catch (error) {
      console.error('[TranslationModel] Error setting translation:', error)
      throw error
    }
  }

  static async delete(key: string, language: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('translations')
        .delete()
        .eq('key', key)
        .eq('language', language)

      if (error) throw error
    } catch (error) {
      console.error('[TranslationModel] Error deleting translation:', error)
      throw error
    }
  }
}
