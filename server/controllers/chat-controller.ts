// server/controllers/chat-controller.ts
// CORRECTED - Import and use ChatModel

import type { H3Event } from 'h3'
import { ChatModel } from '../models/chat-models'
const Chat: any = (ChatModel as any) || {}
import { NotificationModelRuntime as NotificationModel } from '../models/notification'

export interface ChatRequest {
  userId: string
  participantIds?: string[]
  message?: string
  chatId?: string
}

export interface ChatResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

export class ChatController {
  /**
   * Get user's chat list
   */
  static async getUserChats(event: H3Event): Promise<ChatResponse> {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        return { success: false, error: 'Authentication required' }
      }

  // ✅ USE ChatModel (alias assigned at runtime)
  const chats = await Chat.getUserChats(userId)

      return {
        success: true,
        data: chats,
        message: 'Chats retrieved successfully'
      }
    } catch (error) {
      console.error('[ChatController] Get user chats error:', error)
      return { success: false, error: 'Failed to retrieve chats' }
    }
  }

  /**
   * Create new chat
   */
  static async createChat(event: H3Event, participantId: string): Promise<ChatResponse> {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        return { success: false, error: 'Authentication required' }
      }

  // ✅ USE ChatModel (alias assigned at runtime)
  const chat = await Chat.createChat(userId, participantId)

      return {
        success: true,
        data: chat,
        message: 'Chat created successfully'
      }
    } catch (error) {
      console.error('[ChatController] Create chat error:', error)
      return { success: false, error: 'Failed to create chat' }
    }
  }

  /**
   * Send message
   */
  static async sendMessage(
    event: H3Event,
    chatId: string,
    content: string
  ): Promise<ChatResponse> {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        return { success: false, error: 'Authentication required' }
      }

      // ✅ USE ChatModel
  const message = await Chat.sendMessage(chatId, userId, content)

      // ✅ USE NotificationModel - Notify recipient
      const { getAdminClient } = await import('~/server/utils/supabase-server')
      const supabase = await getAdminClient()
      const { data: chat } = await supabase
        .from('chats')
        .select('participant1_id, participant2_id')
        .eq('id', chatId)
        .single()

      const recipientId = chat?.participant1_id === userId ? chat?.participant2_id : chat?.participant1_id

      if (recipientId) {
  await (NotificationModel as any).create({
          userId: recipientId,
          actorId: userId,
          type: 'message',
          title: 'New Message',
          message: content.substring(0, 50),
          data: { chatId, messageId: message.id }
        })
      }

      return {
        success: true,
        data: message,
        message: 'Message sent successfully'
      }
    } catch (error) {
      console.error('[ChatController] Send message error:', error)
      return { success: false, error: 'Failed to send message' }
    }
  }

  /**
   * Get chat messages
   */
  static async getMessages(
    event: H3Event,
    chatId: string,
    limit: number = 50
  ): Promise<ChatResponse> {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        return { success: false, error: 'Authentication required' }
      }

      // ✅ USE ChatModel
  const messages = await Chat.getMessages(chatId, limit)

      return {
        success: true,
        data: messages,
        message: 'Messages retrieved successfully'
      }
    } catch (error) {
      console.error('[ChatController] Get messages error:', error)
      return { success: false, error: 'Failed to retrieve messages' }
    }
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(event: H3Event, chatId: string): Promise<ChatResponse> {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        return { success: false, error: 'Authentication required' }
      }

  // ✅ USE ChatModel (alias assigned at runtime)
  await Chat.markAsRead(chatId, userId)

      return {
        success: true,
        message: 'Messages marked as read'
      }
    } catch (error) {
      console.error('[ChatController] Mark as read error:', error)
      return { success: false, error: 'Failed to mark as read' }
    }
  }

  /**
   * Delete chat
   */
  static async deleteChat(event: H3Event, chatId: string): Promise<ChatResponse> {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        return { success: false, error: 'Authentication required' }
      }

  // ✅ USE ChatModel (alias assigned at runtime)
  await Chat.deleteChat(chatId, userId)

      return {
        success: true,
        message: 'Chat deleted successfully'
      }
    } catch (error) {
      console.error('[ChatController] Delete chat error:', error)
      return { success: false, error: 'Failed to delete chat' }
    }
  }
}

export default ChatController
