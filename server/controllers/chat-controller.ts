// server/controllers/chat-controller.ts - Chat Management Controller
// ============================================================================

import { H3Event, getQuery, readBody } from 'h3'
import { ChatModel } from '../models/chat-models'
import { UserModel } from '../models/user'

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
   * GET /api/chat/list
   */
  static async getUserChats(event: H3Event): Promise<ChatResponse> {
    try {
      const userId = event.context.user?.id
      
      if (!userId) {
        return {
          success: false,
          error: 'Authentication required'
        }
      }

      const chats = await ChatModel.getUserChats(userId)
      
      return {
        success: true,
        data: chats,
        message: 'Chats retrieved successfully'
      }
    } catch (error) {
      console.error('Error fetching user chats:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch chats'
      }
    }
  }

  /**
   * Get chat messages
   * GET /api/chat/:chatId/messages
   */
  static async getChatMessages(event: H3Event): Promise<ChatResponse> {
    try {
      const chatId = event.context.params?.chatId
      const userId = event.context.user?.id
      const limit = parseInt(getQuery(event).limit as string) || 50
      const offset = parseInt(getQuery(event).offset as string) || 0

      if (!chatId || !userId) {
        return {
          success: false,
          error: 'Chat ID and authentication required'
        }
      }

      // Verify user is participant
      const isParticipant = await ChatModel.isUserParticipant(chatId, userId)
      if (!isParticipant) {
        return {
          success: false,
          error: 'Access denied'
        }
      }

      const messages = await ChatModel.getChatMessages(chatId, limit, offset)
      
      return {
        success: true,
        data: messages,
        message: 'Messages retrieved successfully'
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch messages'
      }
    }
  }

  /**
   * Send message
   * POST /api/chat/:chatId/message
   */
  static async sendMessage(event: H3Event): Promise<ChatResponse> {
    try {
      const chatId = event.context.params?.chatId
      const userId = event.context.user?.id
      const body = await readBody(event)
      const { message, attachments = [] } = body

      if (!chatId || !userId) {
        return {
          success: false,
          error: 'Chat ID and authentication required'
        }
      }

      if (!message || message.trim().length === 0) {
        return {
          success: false,
          error: 'Message cannot be empty'
        }
      }

      // Verify user is participant
      const isParticipant = await ChatModel.isUserParticipant(chatId, userId)
      if (!isParticipant) {
        return {
          success: false,
          error: 'Access denied'
        }
      }

      const newMessage = await ChatModel.createMessage({
        chatId,
        senderId: userId,
        content: message,
        attachments,
        createdAt: new Date().toISOString()
      })

      return {
        success: true,
        data: newMessage,
        message: 'Message sent successfully'
      }
    } catch (error) {
      console.error('Error sending message:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      }
    }
  }

  /**
   * Create new chat
   * POST /api/chat/create
   */
  static async createChat(event: H3Event): Promise<ChatResponse> {
    try {
      const userId = event.context.user?.id
      const body = await readBody(event)
      const { participantIds, name, isGroup = false } = body

      if (!userId) {
        return {
          success: false,
          error: 'Authentication required'
        }
      }

      if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return {
          success: false,
          error: 'Participant IDs are required'
        }
      }

      const chat = await ChatModel.createChat({
        creatorId: userId,
        participantIds: [userId, ...participantIds],
        name,
        isGroup,
        createdAt: new Date().toISOString()
      })

      return {
        success: true,
        data: chat,
        message: 'Chat created successfully'
      }
    } catch (error) {
      console.error('Error creating chat:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create chat'
      }
    }
  }

  /**
   * Delete chat
   * DELETE /api/chat/:chatId
   */
  static async deleteChat(event: H3Event): Promise<ChatResponse> {
    try {
      const chatId = event.context.params?.chatId
      const userId = event.context.user?.id

      if (!chatId || !userId) {
        return {
          success: false,
          error: 'Chat ID and authentication required'
        }
      }

      // Verify user is creator or admin
      const isAuthorized = await ChatModel.isUserAuthorized(chatId, userId)
      if (!isAuthorized) {
        return {
          success: false,
          error: 'Access denied'
        }
      }

      await ChatModel.deleteChat(chatId)

      return {
        success: true,
        message: 'Chat deleted successfully'
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete chat'
      }
    }
  }

  /**
   * Mark messages as read
   * POST /api/chat/:chatId/mark-read
   */
  static async markMessagesAsRead(event: H3Event): Promise<ChatResponse> {
    try {
      const chatId = event.context.params?.chatId
      const userId = event.context.user?.id

      if (!chatId || !userId) {
        return {
          success: false,
          error: 'Chat ID and authentication required'
        }
      }

      await ChatModel.markChatAsRead(chatId, userId)

      return {
        success: true,
        message: 'Messages marked as read'
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark messages as read'
      }
    }
  }
}
