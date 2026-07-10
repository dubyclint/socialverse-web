// services/universeService.ts
import { getSupabaseClient } from '~/lib/supabase-factory'

export const universeService = {
  /**
   * Subscribes to the Universe chat channel
   */
  subscribeToUniverse(onMessage: (msg: any) => void) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase client not initialized')
  return supabase!
      .channel('universe_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'universe_messages' }, 
        (payload) => onMessage(payload.new)
      )
      .subscribe()
  },

  /**
   * Fetches initial message history
   */
  async getMessageHistory() {
    const supabase = getSupabaseClient()
    return await supabase
      .from('universe_messages')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50)
  }
}
