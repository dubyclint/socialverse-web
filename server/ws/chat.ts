// FILE: /server/ws/chat.ts - FIXED WITH LAZY LOADING
// ============================================================================
// Direct Messaging WebSocket Handler
// ============================================================================

import type { Socket } from 'socket.io'
import { getWSSupabaseClient } from '~/server/utils/ws-supabase'

interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  type: 'text' | 'image' | 'video' | 'file' | 'emoji' | 'system'
  attachments?: Array<{ url: string; type: string; name?: string }>
  reactions?: Record<string, string[]>
  isEdited: boolean
  editedAt?: string
  isDeleted: boolean
  deletedAt?: string
  createdAt: string
  readBy?: string[]
}

interface ChatSession {
  chatId: string
  participants: Set<string>
  lastActivity: Date
  isActive: boolean
}

interface UserChatSocket extends Socket {
  userId?: string
  activeChatId?: string
}

const activeSessions = new Map<string, ChatSession>()
const userChats = new Map<string, Set<string>>()
const typingIndicators = new Map<string, Set<string>>()

const TYPING_TIMEOUT = 3000
const SESSION_TIMEOUT = 30 * 60 * 1000

export default defineWebSocketHandler({
  async open(peer, socket: UserChatSocket) {
    console.log('[Chat] WebSocket connection opened:', socket.id)
    socket.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to chat server',
      timestamp: new Date().toISOString()
    }))
  },

  async message(peer, socket: UserChatSocket, message) {
    try {
      const data = JSON.parse(message)
      const { type, payload } = data

      switch (type) {
        case 'authenticate':
          await handleAuthenticate(socket, payload)
          break
        case 'join_chat':
          await handleJoinChat(socket, payload)
          break
        case 'leave_chat':
          await handleLeaveChat(socket, payload)
          break
        case 'send_message':
          await handleSendMessage(socket, payload)
          break
        case 'edit_message':
          await handleEditMessage(socket, payload)
          break
        case 'delete_message':
          await handleDeleteMessage(socket, payload)
          break
        case 'typing_start':
          await handleTypingStart(socket, payload)
          break
        case 'typing_stop':
          await handleTypingStop(socket, payload)
          break
        case 'add_reaction':
          await handleAddReaction(socket, payload)
          break
        case 'remove_reaction':
          await handleRemoveReaction(socket, payload)
          break
        case 'mark_as_read':
          await handleMarkAsRead(socket, payload)
          break
        case 'get_messages':
          await handleGetMessages(socket, payload)
          break
        case 'get_chats':
          await handleGetChats(socket, payload)
          break
        case 'create_chat':
          await handleCreateChat(socket, payload)
          break
        default:
          socket.send(JSON.stringify({
            type: 'error',
            message: `Unknown chat type: ${type}`
          }))
      }
    } catch (error) {
      console.error('[Chat] Message error:', error)
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }))
    }
  },

  async close(peer, socket: UserChatSocket) {
    console.log('[Chat] WebSocket connection closed:', socket.id)
    if (socket.activeChatId) {
      const session = activeSessions.get(socket.activeChatId)
      if (session) {
        session.participants.delete(socket.id)
        if (session.participants.size === 0) {
          activeSessions.delete(socket.activeChatId)
        }
      }
    }
  }
})

// ============================================================================
// HANDLER FUNCTIONS
// ============================================================================

async function handleAuthenticate(socket: UserChatSocket, payload: any) {
  try {
    socket.userId = payload.userId
    console.log('[Chat] User authenticated:', socket.userId)
    
    socket.send(JSON.stringify({
      type: 'authenticated',
      userId: socket.userId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Chat] Authentication error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Authentication failed'
    }))
  }
}

async function handleJoinChat(socket: UserChatSocket, payload: any) {
  try {
    const { chatId } = payload
    
    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    socket.activeChatId = chatId
    
    let session = activeSessions.get(chatId)
    if (!session) {
      session = {
        chatId,
        participants: new Set(),
        lastActivity: new Date(),
        isActive: true
      }
      activeSessions.set(chatId, session)
    }
    
    session.participants.add(socket.id)
    
    if (!userChats.has(socket.userId)) {
      userChats.set(socket.userId, new Set())
    }
    userChats.get(socket.userId)!.add(chatId)

    socket.send(JSON.stringify({
      type: 'joined_chat',
      chatId,
      participantCount: session.participants.size,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Chat] Join chat error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to join chat'
    }))
  }
}

async function handleLeaveChat(socket: UserChatSocket, payload: any) {
  try {
    const { chatId } = payload
    
    const session = activeSessions.get(chatId)
    if (session) {
      session.participants.delete(socket.id)
      if (session.participants.size === 0) {
        activeSessions.delete(chatId)
      }
    }

    socket.send(JSON.stringify({
      type: 'left_chat',
      chatId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Chat] Leave chat error:', error)
  }
}

async function handleSendMessage(socket: UserChatSocket, payload: any) {
  try {
    // ✅ NOW USE LAZY-LOADED SUPABASE
    const supabase = await getWSSupabaseClient()
    
    const { chatId, content, type } = payload
    
    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      chatId,
      senderId: socket.userId,
      senderName: payload.senderName || 'Unknown',
      content,
      type: type || 'text',
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString()
    }

    // Save to database
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        id: message.id,
        chat_id: chatId,
        sender_id: socket.userId,
        content,
        type: message.type,
        created_at: message.createdAt
      })

    if (error) {
      throw error
    }

    // Broadcast to all participants in the chat
    const session = activeSessions.get(chatId)
    if (session) {
      const broadcastMessage = JSON.stringify({
        type: 'new_message',
        message,
        timestamp: new Date().toISOString()
      })
      
      // Send to all connected clients in this chat
      // (Implementation depends on your Socket.IO setup)
    }

    socket.send(JSON.stringify({
      type: 'message_sent',
      messageId: message.id,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Chat] Send message error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to send message'
    }))
  }
}

async function handleEditMessage(socket: UserChatSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { messageId, content } = payload

    const { error } = await supabase
      .from('chat_messages')
      .update({
        content,
        is_edited: true,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'message_edited',
      messageId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Chat] Edit message error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to edit message'
    }))
  }
}

async function handleDeleteMessage(socket: UserChatSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { messageId } = payload

    const { error } = await supabase
      .from('chat_messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', messageId)

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'message_deleted',
      messageId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Chat] Delete message error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to delete message'
    }))
  }
}

async function handleTypingStart(socket: UserChatSocket, payload: any) {
  try {
    const { chatId } = payload
    
    if (!typingIndicators.has(chatId)) {
      typingIndicators.set(chatId, new Set())
    }
    
    typingIndicators.get(chatId)!.add(socket.id)

    socket.send(JSON.stringify({
      type: 'typing_started',
      chatId,
      timestamp: new Date().toISOString()
    }))

    setTimeout(() => {
      const typing = typingIndicators.get(chatId)
      if (typing) {
        typing.delete(socket.id)
      }
    }, TYPING_TIMEOUT)
  } catch (error) {
    console.error('[Chat] Typing start error:', error)
  }
}

async function handleTypingStop(socket: UserChatSocket, payload: any) {
  try {
    const { chatId } = payload
    
    const typing = typingIndicators.get(chatId)
    if (typing) {
      typing.delete(socket.id)
    }

    socket.send(JSON.stringify({
      type: 'typing_stopped',
      chatId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Chat] Typing stop error:', error)
  }
}

async function handleAddReaction(socket: UserChatSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { messageId, emoji } = payload

    const { error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: socket.userId,
        emoji,
        created_at: new Date().toISOString()
      })

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'reaction_added',
      messageId,
      emoji,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Chat] Add reaction error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to add reaction'
    }))
  }
}

async function handleRemoveReaction(socket: UserChatSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { messageId, emoji } = payload

    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', socket.userId)
      .eq('emoji', emoji)

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'reaction_removed',
      messageId,
      emoji,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Chat] Remove reaction error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to remove reaction'
    }))
  }
}

async function handleMarkAsRead(socket: UserChatSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { messageId } = payload

    const { error } = await supabase
      .from('message_reads')
      .insert({
        message_id: messageId,
        user_id: socket.userId,
        read_at: new Date().toISOString()
      })

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'marked_as_read',
      messageId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Chat] Mark as read error:', error)
  }
}

async function handleGetMessages(socket: UserChatSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { chatId, limit = 50, offset = 0 } = payload

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'messages',
      messages: data || [],
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Chat] Get messages error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch messages'
    }))
  }
}

async function handleGetChats(socket: UserChatSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .contains('participant_ids', [socket.userId])

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'chats',
      chats: data || [],
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Chat] Get chats error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch chats'
    }))
  }
}

async function handleCreateChat(socket: UserChatSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { participantIds, name } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const chatId = crypto.randomUUID()
    const allParticipants = [socket.userId, ...participantIds]

    const { error } = await supabase
      .from('chats')
      .insert({
        id: chatId,
        name: name || 'New Chat',
        participant_ids: allParticipants,
        created_by: socket.userId,
        created_at: new Date().toISOString()
      })

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'chat_created',
      chatId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Chat] Create chat error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to create chat'
    }))
  }
}
