// ============================================================================
// FILE: /services/chatService.ts
// ============================================================================
import { api, unwrap } from './api'
import { useSupabaseClient } from '#imports'
import type { ChatMessage } from '~/types/chat'

export const chatService = {
  /**
   * Fetches historical messages for a chat room.
   */
  async getMessages(chatId: string): Promise<ChatMessage[]> {
    // Example using your centralized API orchestrator
    const res = await api(`/chat/${chatId}/messages`)
    return unwrap<ChatMessage[]>(res)
  },

  /**
   * Sends a message via API.
   */
  async sendMessage(chatId: string, content: string) {
    return await api(`/chat/${chatId}/send`, {
      method: 'POST',
      body: { content }
    })
  },

  /**
   * Manages Supabase Realtime subscription.
   */
  subscribeToChat(chatId: string, onMessage: (msg: any) => void) {
    const client = useSupabaseClient()
    return client
      .channel(`chat:${chatId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `chat_id=eq.${chatId}` 
      }, (payload) => onMessage(payload.new))
      .subscribe()
  }
}
