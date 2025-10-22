import { supabase } from '~/server/db'

export interface TranslationEntry {
  id: string
  key: string
  language: string
  value: string
  updatedAt: string
  updatedBy: string
}

export class TranslationModel {
  static async get(key: string, language: string) {
    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .eq('key', key)
      .eq('language', language)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as TranslationEntry | null
  }

  static async getByLanguage(language: string) {
    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .eq('language', language)

    if (error) throw error
    return data as TranslationEntry[]
  }

  static async set(key: string, language: string, value: string, updatedBy: string) {
    const existing = await this.get(key, language)

    if (existing) {
      const { data, error } = await supabase
        .from('translations')
        .update({
          value,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data as TranslationEntry
    } else {
      const { data, error } = await supabase
        .from('translations')
        .insert([
          {
            key,
            language,
            value,
            updated_at: new Date().toISOString(),
            updated_by: updatedBy
          }
        ])
        .select()
        .single()

      if (error) throw error
      return data as TranslationEntry
    }
  }

  static async getAll() {
    const { data, error } = await supabase
      .from('translations')
      .select('*')

    if (error) throw error
    return data as TranslationEntry[]
  }
}
