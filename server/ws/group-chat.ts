// FILE: /server/ws/group-chat.ts - FIXED WITH LAZY LOADING
// ============================================================================
// Group Chat WebSocket Handler
// ============================================================================

import type { Socket } from 'socket.io'
import { getWSSupabaseClient } from '~/server/utils/ws-supabase'

interface GroupChatMessage {
  id: string
  groupId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  type: 'text' | 'image' | 'video' | 'file' | 'system' | 'announcement'
  attachments?: Array<{ url: string; type: string; name?: string }>
  reactions?: Record<string, string[]>
  isEdited: boolean
  editedAt?: string
  isDeleted: boolean
  deletedAt?: string
  createdAt: string
  readBy?: string[]
}

interface GroupChatSession {
  groupId: string
  participants: Set<string>
  lastActivity: Date
  isActive: boolean
  memberCount: number
}

interface UserGroupChatSocket extends Socket {
  userId?: string
  activeGroupId?: string
}

const activeGroupSessions = new Map<string, GroupChatSession>()
const userGroupChats = new Map<string, Set<string>>()
const typingIndicators = new Map<string, Set<string>>()

const TYPING_TIMEOUT = 3000
const SESSION_TIMEOUT = 30 * 60 * 1000

export default defineWebSocketHandler({
  async open(peer, socket: UserGroupChatSocket) {
    console.log('[GroupChat] WebSocket connection opened:', socket.id)
    socket.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to group chat server',
      timestamp: new Date().toISOString()
    }))
  },

  async message(peer, socket: UserGroupChatSocket, message) {
    try {
      const data = JSON.parse(message)
      const { type, payload } = data

      switch (type) {
        case 'authenticate':
          await handleAuthenticate(socket, payload)
          break
        case 'join_group':
          await handleJoinGroup(socket, payload)
          break
        case 'leave_group':
          await handleLeaveGroup(socket, payload)
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
        case 'get_messages':
          await handleGetMessages(socket, payload)
          break
        case 'get_groups':
          await handleGetGroups(socket, payload)
          break
        case 'create_group':
          await handleCreateGroup(socket, payload)
          break
        case 'update_group':
          await handleUpdateGroup(socket, payload)
          break
        case 'add_member':
          await handleAddMember(socket, payload)
          break
        case 'remove_member':
          await handleRemoveMember(socket, payload)
          break
        default:
          socket.send(JSON.stringify({
            type: 'error',
            message: `Unknown group chat type: ${type}`
          }))
      }
    } catch (error) {
      console.error('[GroupChat] Message error:', error)
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process group chat message'
      }))
    }
  },

  async close(peer, socket: UserGroupChatSocket) {
    console.log('[GroupChat] WebSocket connection closed:', socket.id)
    if (socket.activeGroupId) {
      const session = activeGroupSessions.get(socket.activeGroupId)
      if (session) {
        session.participants.delete(socket.id)
        if (session.participants.size === 0) {
          activeGroupSessions.delete(socket.activeGroupId)
        }
      }
    }
  }
})

// ============================================================================
// HANDLER FUNCTIONS
// ============================================================================

async function handleAuthenticate(socket: UserGroupChatSocket, payload: any) {
  try {
    socket.userId = payload.userId
    console.log('[GroupChat] User authenticated:', socket.userId)
    
    socket.send(JSON.stringify({
      type: 'authenticated',
      userId: socket.userId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[GroupChat] Authentication error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Authentication failed'
    }))
  }
}

async function handleJoinGroup(socket: UserGroupChatSocket, payload: any) {
  try {
    const { groupId } = payload
    
    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    socket.activeGroupId = groupId
    
    let session = activeGroupSessions.get(groupId)
    if (!session) {
      session = {
        groupId,
        participants: new Set(),
        lastActivity: new Date(),
        isActive: true,
        memberCount: 0
      }
      activeGroupSessions.set(groupId, session)
    }
    
    session.participants.add(socket.id)
    
    if (!userGroupChats.has(socket.userId)) {
      userGroupChats.set(socket.userId, new Set())
    }
    userGroupChats.get(socket.userId)!.add(groupId)

    socket.send(JSON.stringify({
      type: 'joined_group',
      groupId,
      participantCount: session.participants.size,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[GroupChat] Join group error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to join group'
    }))
  }
}

async function handleLeaveGroup(socket: UserGroupChatSocket, payload: any) {
  try {
    const { groupId } = payload
    
    const session = activeGroupSessions.get(groupId)
    if (session) {
      session.participants.delete(socket.id)
      if (session.participants.size === 0) {
        activeGroupSessions.delete(groupId)
      }
    }

    socket.send(JSON.stringify({
      type: 'left_group',
      groupId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[GroupChat] Leave group error:', error)
  }
}

async function handleSendMessage(socket: UserGroupChatSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    
    const { groupId, content, type } = payload
    
    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const message: GroupChatMessage = {
      id: crypto.randomUUID(),
      groupId,
      senderId: socket.userId,
      senderName: payload.senderName || 'Unknown',
      content,
      type: type || 'text',
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString()
    }

    const { error } = await supabase
      .from('group_chat_messages')
      .insert({
        id: message.id,
        group_id: groupId,
        sender_id: socket.userId,
        content,
        type: message.type,
        created_at: message.createdAt
      })

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'message_sent',
      messageId: message.id,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[GroupChat] Send message error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to send message'
    }))
  }
}

async function handleEditMessage(socket: UserGroupChatSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { messageId, content } = payload

    const { error } = await supabase
      .from('group_chat_messages')
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
    console.error('[GroupChat] Edit message error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to edit message'
    }))
  }
}

async function handleDeleteMessage(socket: UserGroupChatSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { messageId } = payload

    const { error } = await supabase
      .from('group_chat_messages')
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
    console.error('[GroupChat] Delete message error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to delete message'
    }))
  }
}

async function handleTypingStart(socket: UserGroupChatSocket, payload: any) {
  try {
    const { groupId } = payload
    
    if (!typingIndicators.has(groupId)) {
      typingIndicators.set(groupId, new Set())
    }
    
    typingIndicators.get(groupId)!.add(socket.id)

    socket.send(JSON.stringify({
      type: 'typing_started',
      groupId,
      timestamp: new Date().toISOString()
    }))

    setTimeout(() => {
      const typing = typingIndicators.get(groupId)
      if (typing) {
        typing.delete(socket.id)
      }
    }, TYPING_TIMEOUT)
  } catch (error) {
    console.error('[GroupChat] Typing start error:', error)
  }
}

async function handleTypingStop(socket: UserGroupChatSocket, payload: any) {
  try {
    const { groupId } = payload
    
    const typing = typingIndicators.get(groupId)
    if (typing) {
      typing.delete(socket.id)
    }

    socket.send(JSON.stringify({
      type: 'typing_stopped',
      groupId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[GroupChat] Typing stop error:', error)
  }
}

async function handleAddReaction(socket: UserGroupChatSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { messageId, emoji } = payload

    const { error } = await supabase
      .from('group_message_reactions')
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
    console.error('[GroupChat] Add reaction error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to add reaction'
    }))
  }
}

async function handleRemoveReaction(socket: UserGroupChatSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { messageId, emoji } = payload

    const { error } = await supabase
      .from('group_message_reactions')
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
    console.error('[GroupChat] Remove reaction error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to remove reaction'
    }))
  }
}

async function handleGetMessages(socket: UserGroupChatSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { groupId, limit = 50, offset = 0 } = payload

    const { data, error } = await supabase
      .from('group_chat_messages')
      .select('*')
      .eq('group_id', groupId)
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
    console.error('[GroupChat] Get messages error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch messages'
    }))
  }
}

async function handleGetGroups(socket: UserGroupChatSocket, payload: any) {
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
      .from('groups')
      .select('*')
      .contains('member_ids', [socket.userId])

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'groups',
      groups: data || [],
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[GroupChat] Get groups error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch groups'
    }))
  }
}

async function handleCreateGroup(socket: UserGroupChatSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { name, description, memberIds } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const groupId = crypto.randomUUID()
    const allMembers = [socket.userId, ...memberIds]

    const { error } = await supabase
      .from('groups')
      .insert({
        id: groupId,
        name,
        description,
        member_ids: allMembers,
        created_by: socket.userId,
        created_at: new Date().toISOString()
      })

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'group_created',
      groupId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[GroupChat] Create group error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to create group'
    }))
  }
}

async function handleUpdateGroup(socket: UserGroupChatSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { groupId, name, description } = payload

    const { error } = await supabase
      .from('groups')
      .update({
        name,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId)

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'group_updated',
      groupId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[GroupChat] Update group error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to update group'
    }))
  }
}

async function handleAddMember(socket: UserGroupChatSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { groupId, memberId } = payload

    const { data: group, error: fetchError } = await supabase
      .from('groups')
      .select('member_ids')
      .eq('id', groupId)
      .single()

    if (fetchError) throw fetchError

    const updatedMembers = [...(group.member_ids || []), memberId]

    const { error } = await supabase
      .from('groups')
      .update({
        member_ids: updatedMembers,
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId)

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'member_added',
      groupId,
      memberId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[GroupChat] Add member error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to add member'
    }))
  }
}

async function handleRemoveMember(socket: UserGroupChatSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { groupId, memberId } = payload

    const { data: group, error: fetchError } = await supabase
      .from('groups')
      .select('member_ids')
      .eq('id', groupId)
      .single()

    if (fetchError) throw fetchError

    const updatedMembers = (group.member_ids || []).filter((id: string) => id !== memberId)

    const { error } = await supabase
      .from('groups')
      .update({
        member_ids: updatedMembers,
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId)

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'member_removed',
      groupId,
      memberId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[GroupChat] Remove member error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to remove member'
    }))
  }
}
