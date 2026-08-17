// ============================================================================
// FILE: /services/chatService.ts
// ============================================================================
import { api, unwrap } from './http'
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
    return await api(`/chat/${chatId}/messages`, {
      method: 'POST',
      body: { message: content }
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
        table: 'chat_messages',
        filter: `room_id=eq.${chatId}`
      }, (payload: any) => onMessage(payload.new))
      .subscribe()
  }
}
