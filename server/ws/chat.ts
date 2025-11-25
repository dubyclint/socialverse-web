// server/ws/chat.ts
// Direct Messaging WebSocket Handler

import type { Socket } from 'socket.io'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
        message: 'Failed to process chat message'
      }))
    }
  },

  async close(peer, socket: UserChatSocket) {
    console.log('[Chat] Connection closed:', socket.id)
    if (socket.userId && socket.activeChatId) {
      const session = activeSessions.get(socket.activeChatId)
      if (session) {
        session.participants.delete(socket.userId)
        if (session.participants.size === 0) {
          activeSessions.delete(socket.activeChatId)
        }
      }
    }
  }
})

async function handleAuthenticate(socket: UserChatSocket, payload: any) {
  try {
    const { userId } = payload
    if (!userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'User ID required' }))
      return
    }
    socket.userId = userId
    if (!userChats.has(userId)) {
      userChats.set(userId, new Set())
    }
    socket.send(JSON.stringify({ type: 'authenticated', userId, socketId: socket.id }))
    console.log(`[Chat] User ${userId} authenticated`)
  } catch (error) {
    console.error('[Chat] Auth error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }))
  }
}

async function handleJoinChat(socket: UserChatSocket, payload: any) {
  try {
    const { chatId } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    socket.activeChatId = chatId
    if (!activeSessions.has(chatId)) {
      activeSessions.set(chatId, {
        chatId,
        participants: new Set(),
        lastActivity: new Date(),
        isActive: true
      })
    }
    const session = activeSessions.get(chatId)!
    session.participants.add(socket.userId)
    session.lastActivity = new Date()
    userChats.get(socket.userId)!.add(chatId)
    socket.send(JSON.stringify({
      type: 'joined_chat',
      chatId,
      participants: Array.from(session.participants)
    }))
    broadcastToChatParticipants(chatId, {
      type: 'user_joined',
      userId: socket.userId,
      participants: Array.from(session.participants)
    }, socket.userId)
    console.log(`[Chat] User ${socket.userId} joined chat ${chatId}`)
  } catch (error) {
    console.error('[Chat] Join chat error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to join chat' }))
  }
}

async function handleLeaveChat(socket: UserChatSocket, payload: any) {
  try {
    const { chatId } = payload
    if (!socket.userId) return
    const session = activeSessions.get(chatId)
    if (session) {
      session.participants.delete(socket.userId)
      if (session.participants.size === 0) {
        activeSessions.delete(chatId)
      }
    }
    userChats.get(socket.userId)?.delete(chatId)
    socket.activeChatId = undefined
    socket.send(JSON.stringify({ type: 'left_chat', chatId }))
    broadcastToChatParticipants(chatId, { type: 'user_left', userId: socket.userId })
  } catch (error) {
    console.error('[Chat] Leave chat error:', error)
  }
}

async function handleSendMessage(socket: UserChatSocket, payload: any) {
  try {
    const { chatId, content, attachments } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const messageId = `msg_${Date.now()}_${socket.userId}`
    const { data: userData } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('id', socket.userId)
      .single()
    const message: ChatMessage = {
      id: messageId,
      chatId,
      senderId: socket.userId,
      senderName: userData?.username || 'Unknown',
      senderAvatar: userData?.avatar_url,
      content,
      type: attachments ? 'file' : 'text',
      attachments,
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString()
    }
    const { error: dbError } = await supabase
      .from('chat_messages')
      .insert({
        id: messageId,
        chat_id: chatId,
        sender_id: socket.userId,
        content,
        type: message.type,
        attachments,
        created_at: new Date().toISOString()
      })
    if (dbError) throw dbError
    await supabase
      .from('chats')
      .update({
        last_message: content,
        last_message_at: new Date().toISOString()
      })
      .eq('id', chatId)
    socket.send(JSON.stringify({ type: 'message_sent', message }))
    broadcastToChatParticipants(chatId, { type: 'new_message', message })
    console.log(`[Chat] Message sent in chat ${chatId} by user ${socket.userId}`)
  } catch (error) {
    console.error('[Chat] Send message error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to send message' }))
  }
}

async function handleEditMessage(socket: UserChatSocket, payload: any) {
  try {
    const { messageId, chatId, content } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const { error } = await supabase
      .from('chat_messages')
      .update({
        content,
        is_edited: true,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('sender_id', socket.userId)
    if (error) throw error
    socket.send(JSON.stringify({ type: 'message_edited', messageId }))
    broadcastToChatParticipants(chatId, { type: 'message_edited', messageId, content })
  } catch (error) {
    console.error('[Chat] Edit message error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to edit message' }))
  }
}

async function handleDeleteMessage(socket: UserChatSocket, payload: any) {
  try {
    const { messageId, chatId } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const { error } = await supabase
      .from('chat_messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('sender_id', socket.userId)
    if (error) throw error
    socket.send(JSON.stringify({ type: 'message_deleted', messageId }))
    broadcastToChatParticipants(chatId, { type: 'message_deleted', messageId })
  } catch (error) {
    console.error('[Chat] Delete message error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to delete message' }))
  }
}

async function handleTypingStart(socket: UserChatSocket, payload: any) {
  try {
    const { chatId } = payload
    if (!socket.userId) return
    if (!typingIndicators.has(chatId)) {
      typingIndicators.set(chatId, new Set())
    }
    typingIndicators.get(chatId)!.add(socket.userId)
    broadcastToChatParticipants(chatId, { type: 'typing_start', userId: socket.userId }, socket.userId)
    setTimeout(() => {
      const typingSet = typingIndicators.get(chatId)
      if (typingSet) {
        typingSet.delete(socket.userId)
      }
    }, TYPING_TIMEOUT)
  } catch (error) {
    console.error('[Chat] Typing start error:', error)
  }
}

async function handleTypingStop(socket: UserChatSocket, payload: any) {
  try {
    const { chatId } = payload
    if (!socket.userId) return
    const typingSet = typingIndicators.get(chatId)
    if (typingSet) {
      typingSet.delete(socket.userId)
    }
    broadcastToChatParticipants(chatId, { type: 'typing_stop', userId: socket.userId }, socket.userId)
  } catch (error) {
    console.error('[Chat] Typing stop error:', error)
  }
}

async function handleAddReaction(socket: UserChatSocket, payload: any) {
  try {
    const { messageId, chatId, emoji } = payload
    if (!socket.userId) return
    const { error } = await supabase
      .from('message_reactions')
      .insert({ message_id: messageId, user_id: socket.userId, emoji })
    if (error) throw error
    broadcastToChatParticipants(chatId, {
      type: 'reaction_added',
      messageId,
      userId: socket.userId,
      emoji
    })
  } catch (error) {
    console.error('[Chat] Add reaction error:', error)
  }
}

async function handleRemoveReaction(socket: UserChatSocket, payload: any) {
  try {
    const { messageId, chatId, emoji } = payload
    if (!socket.userId) return
    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', socket.userId)
      .eq('emoji', emoji)
    if (error) throw error
    broadcastToChatParticipants(chatId, {
      type: 'reaction_removed',
      messageId,
      userId: socket.userId,
      emoji
    })
  } catch (error) {
    console.error('[Chat] Remove reaction error:', error)
  }
}

async function handleMarkAsRead(socket: UserChatSocket, payload: any) {
  try {
    const { chatId, messageIds } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    for (const messageId of messageIds) {
      await supabase
        .from('message_reads')
        .insert({
          message_id: messageId,
          user_id: socket.userId,
          read_at: new Date().toISOString()
        })
        .onConflict('message_id,user_id')
        .upsert()
    }
    socket.send(JSON.stringify({ type: 'marked_as_read', messageIds }))
    broadcastToChatParticipants(chatId, {
      type: 'messages_read',
      userId: socket.userId,
      messageIds
    })
  } catch (error) {
    console.error('[Chat] Mark as read error:', error)
  }
}

async function handleGetMessages(socket: UserChatSocket, payload: any) {
  try {
    const { chatId, limit = 50, offset = 0 } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) throw error
    socket.send(JSON.stringify({
      type: 'messages_list',
      messages: messages?.reverse() || [],
      offset,
      limit
    }))
  } catch (error) {
    console.error('[Chat] Get messages error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to fetch messages' }))
  }
}

async function handleGetChats(socket: UserChatSocket, payload: any) {
  try {
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const { data: chats, error } = await supabase
      .from('chats')
      .select('*')
      .or(`participant1_id.eq.${socket.userId},participant2_id.eq.${socket.userId}`)
      .order('last_message_at', { ascending: false })
    if (error) throw error
    socket.send(JSON.stringify({ type: 'chats_list', chats: chats || [] }))
  } catch (error) {
    console.error('[Chat] Get chats error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to fetch chats' }))
  }
}

async function handleCreateChat(socket: UserChatSocket, payload: any) {
  try {
    const { participantId } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const chatId = `chat_${Date.now()}_${socket.userId}_${participantId}`
    const { error } = await supabase
      .from('chats')
      .insert({
        id: chatId,
        participant1_id: socket.userId,
        participant2_id: participantId,
        created_at: new Date().toISOString()
      })
    if (error && !error.message.includes('duplicate')) throw error
    socket.send(JSON.stringify({ type: 'chat_created', chatId }))
  } catch (error) {
    console.error('[Chat] Create chat error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to create chat' }))
  }
}

function broadcastToChatParticipants(chatId: string, message: any, excludeUserId?: string) {
  const session = activeSessions.get(chatId)
  if (session) {
    session.participants.forEach(userId => {
      if (excludeUserId && userId === excludeUserId) return
      console.log(`[Chat] Broadcasting to user ${userId} in chat ${chatId}`)
    })
  }
}
