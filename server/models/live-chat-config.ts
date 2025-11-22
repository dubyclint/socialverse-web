import { supabase } from '~/server/db'

export interface LiveChatConfig {
  id: string
  method: 'widget' | 'native' | 'redirect'
  label: string
  script?: string
  url?: string
  active: boolean
  region?: string
  updatedAt: string
  updatedBy?: string
}

export class LiveChatConfigModel {
  static async getActive() {
    const { data, error } = await supabase
      .from('live_chat_configs')
      .select('*')
      .eq('active', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as LiveChatConfig | null
  }

  static async getByRegion(region: string) {
    const { data, error } = await supabase
      .from('live_chat_configs')
      .select('*')
      .eq('region', region)
      .eq('active', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as LiveChatConfig | null
  }

  static async update(id: string, updates: Partial<LiveChatConfig>, updatedBy?: string) {
    const { data, error } = await supabase
      .from('live_chat_configs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as LiveChatConfig
  }

  static async getAll() {
    const { data, error } = await supabase
      .from('live_chat_configs')
      .select('*')

    if (error) throw error
    return data as LiveChatConfig[]
  }
}
