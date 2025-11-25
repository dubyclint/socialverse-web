// server/ws/group-chat.ts
// Group Chat WebSocket Handler

import type { Socket } from 'socket.io'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
  mentions?: string[]
}

interface GroupChatSession {
  groupId: string
  participants: Map<string, { userId: string; role: 'admin' | 'moderator' | 'member' }>
  lastActivity: Date
  isActive: boolean
}

interface UserGroupChatSocket extends Socket {
  userId?: string
  activeGroupId?: string
}

const activeSessions = new Map<string, GroupChatSession>()
const userGroups = new Map<string, Set<string>>()
const typingIndicators = new Map<string, Set<string>>()
const mutedUsers = new Map<string, Set<string>>()

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
        case 'mute_user':
          await handleMuteUser(socket, payload)
          break
        case 'unmute_user':
          await handleUnmuteUser(socket, payload)
          break
        case 'kick_user':
          await handleKickUser(socket, payload)
          break
        case 'promote_user':
          await handlePromoteUser(socket, payload)
          break
        case 'demote_user':
          await handleDemoteUser(socket, payload)
          break
        case 'get_messages':
          await handleGetMessages(socket, payload)
          break
        case 'get_members':
          await handleGetMembers(socket, payload)
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
    console.log('[GroupChat] Connection closed:', socket.id)
    if (socket.userId && socket.activeGroupId) {
      const session = activeSessions.get(socket.activeGroupId)
      if (session) {
        session.participants.delete(socket.userId)
        if (session.participants.size === 0) {
          activeSessions.delete(socket.activeGroupId)
        }
      }
    }
  }
})

async function handleAuthenticate(socket: UserGroupChatSocket, payload: any) {
  try {
    const { userId } = payload
    if (!userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'User ID required' }))
      return
    }
    socket.userId = userId
    if (!userGroups.has(userId)) {
      userGroups.set(userId, new Set())
    }
    socket.send(JSON.stringify({ type: 'authenticated', userId, socketId: socket.id }))
    console.log(`[GroupChat] User ${userId} authenticated`)
  } catch (error) {
    console.error('[GroupChat] Auth error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }))
  }
}

async function handleJoinGroup(socket: UserGroupChatSocket, payload: any) {
  try {
    const { groupId } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', socket.userId)
      .single()
    if (!membership) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not a member of this group' }))
      return
    }
    socket.activeGroupId = groupId
    if (!activeSessions.has(groupId)) {
      activeSessions.set(groupId, {
        groupId,
        participants: new Map(),
        lastActivity: new Date(),
        isActive: true
      })
    }
    const session = activeSessions.get(groupId)!
    session.participants.set(socket.userId, {
      userId: socket.userId,
      role: membership.role
    })
    session.lastActivity = new Date()
    userGroups.get(socket.userId)!.add(groupId)
    socket.send(JSON.stringify({
      type: 'joined_group',
      groupId,
      participants: Array.from(session.participants.values())
    }))
    broadcastToGroupParticipants(groupId, {
      type: 'user_joined',
      userId: socket.userId,
      participants: Array.from(session.participants.values())
    }, socket.userId)
    console.log(`[GroupChat] User ${socket.userId} joined group ${groupId}`)
  } catch (error) {
    console.error('[GroupChat] Join group error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to join group' }))
  }
}

async function handleLeaveGroup(socket: UserGroupChatSocket, payload: any) {
  try {
    const { groupId } = payload
    if (!socket.userId) return
    const session = activeSessions.get(groupId)
    if (session) {
      session.participants.delete(socket.userId)
      if (session.participants.size === 0) {
        activeSessions.delete(groupId)
      }
    }
    userGroups.get(socket.userId)?.delete(groupId)
    socket.activeGroupId = undefined
    socket.send(JSON.stringify({ type: 'left_group', groupId }))
    broadcastToGroupParticipants(groupId, { type: 'user_left', userId: socket.userId })
  } catch (error) {
    console.error('[GroupChat] Leave group error:', error)
  }
}

async function handleSendMessage(socket: UserGroupChatSocket, payload: any) {
  try {
    const { groupId, content, attachments, mentions } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const mutedSet = mutedUsers.get(groupId)
    if (mutedSet?.has(socket.userId)) {
      socket.send(JSON.stringify({ type: 'error', message: 'You are muted in this group' }))
      return
    }
    const messageId = `gmsg_${Date.now()}_${socket.userId}`
    const { data: userData } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('id', socket.userId)
      .single()
    const message: GroupChatMessage = {
      id: messageId,
      groupId,
      senderId: socket.userId,
      senderName: userData?.username || 'Unknown',
      senderAvatar: userData?.avatar_url,
      content,
      type: attachments ? 'file' : 'text',
      attachments,
      mentions,
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString()
    }
    const { error: dbError } = await supabase
      .from('group_chat_messages')
      .insert({
        id: messageId,
        group_id: groupId,
        sender_id: socket.userId,
        content,
        type: message.type,
        attachments,
        mentions,
        created_at: new Date().toISOString()
      })
    if (dbError) throw dbError
    socket.send(JSON.stringify({ type: 'message_sent', message }))
    broadcastToGroupParticipants(groupId, { type: 'new_message', message })
    console.log(`[GroupChat] Message sent in group ${groupId} by user ${socket.userId}`)
  } catch (error) {
    console.error('[GroupChat] Send message error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to send message' }))
  }
}

async function handleEditMessage(socket: UserGroupChatSocket, payload: any) {
  try {
    const { messageId, groupId, content } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const { error } = await supabase
      .from('group_chat_messages')
      .update({
        content,
        is_edited: true,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('sender_id', socket.userId)
    if (error) throw error
    socket.send(JSON.stringify({ type: 'message_edited', messageId }))
    broadcastToGroupParticipants(groupId, { type: 'message_edited', messageId, content })
  } catch (error) {
    console.error('[GroupChat] Edit message error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to edit message' }))
  }
}

async function handleDeleteMessage(socket: UserGroupChatSocket, payload: any) {
  try {
    const { messageId, groupId } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const { error } = await supabase
      .from('group_chat_messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('sender_id', socket.userId)
    if (error) throw error
    socket.send(JSON.stringify({ type: 'message_deleted', messageId }))
    broadcastToGroupParticipants(groupId, { type: 'message_deleted', messageId })
  } catch (error) {
    console.error('[GroupChat] Delete message error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to delete message' }))
  }
}

async function handleTypingStart(socket: UserGroupChatSocket, payload: any) {
  try {
    const { groupId } = payload
    if (!socket.userId) return
    if (!typingIndicators.has(groupId)) {
      typingIndicators.set(groupId, new Set())
    }
    typingIndicators.get(groupId)!.add(socket.userId)
    broadcastToGroupParticipants(groupId, { type: 'typing_start', userId: socket.userId }, socket.userId)
    setTimeout(() => {
      const typingSet = typingIndicators.get(groupId)
      if (typingSet) {
        typingSet.delete(socket.userId)
      }
    }, TYPING_TIMEOUT)
  } catch (error) {
    console.error('[GroupChat] Typing start error:', error)
  }
}

async function handleTypingStop(socket: UserGroupChatSocket, payload: any) {
  try {
    const { groupId } = payload
    if (!socket.userId) return
    const typingSet = typingIndicators.get(groupId)
    if (typingSet) {
      typingSet.delete(socket.userId)
    }
    broadcastToGroupParticipants(groupId, { type: 'typing_stop', userId: socket.userId }, socket.userId)
  } catch (error) {
    console.error('[GroupChat] Typing stop error:', error)
  }
}

async function handleAddReaction(socket: UserGroupChatSocket, payload: any) {
  try {
    const { messageId, groupId, emoji } = payload
    if (!socket.userId) return
    const { error } = await supabase
      .from('group_message_reactions')
      .insert({ message_id: messageId, user_id: socket.userId, emoji })
    if (error) throw error
    broadcastToGroupParticipants(groupId, {
      type: 'reaction_added',
      messageId,
      userId: socket.userId,
      emoji
    })
  } catch (error) {
    console.error('[GroupChat] Add reaction error:', error)
  }
}

async function handleRemoveReaction(socket: UserGroupChatSocket, payload: any) {
  try {
    const { messageId, groupId, emoji } = payload
    if (!socket.userId) return
    const { error } = await supabase
      .from('group_message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', socket.userId)
      .eq('emoji', emoji)
    if (error) throw error
    broadcastToGroupParticipants(groupId, {
      type: 'reaction_removed',
      messageId,
      userId: socket.userId,
      emoji
    })
  } catch (error) {
    console.error('[GroupChat] Remove reaction error:', error)
  }
}

async function handleMuteUser(socket: UserGroupChatSocket, payload: any) {
  try {
    const { groupId, targetUserId, duration } = payload
    if (!socket.userId) return
    const session = activeSessions.get(groupId)
    const userRole = session?.participants.get(socket.userId)?.role
    if (!['admin', 'moderator'].includes(userRole || '')) {
      socket.send(JSON.stringify({ type: 'error', message: 'Insufficient permissions' }))
      return
    }
    if (!mutedUsers.has(groupId)) {
      mutedUsers.set(groupId, new Set())
    }
    mutedUsers.get(groupId)!.add(targetUserId)
    broadcastToGroupParticipants(groupId, { type: 'user_muted', userId: targetUserId, duration })
    if (duration) {
      setTimeout(() => {
        const mutedSet = mutedUsers.get(groupId)
        if (mutedSet) {
          mutedSet.delete(targetUserId)
        }
      }, duration)
    }
  } catch (error) {
    console.error('[GroupChat] Mute user error:', error)
  }
}

async function handleUnmuteUser(socket: UserGroupChatSocket, payload: any) {
  try {
    const { groupId, targetUserId } = payload
    if (!socket.userId) return
    const session = activeSessions.get(groupId)
    const userRole = session?.participants.get(socket.userId)?.role
    if (!['admin', 'moderator'].includes(userRole || '')) {
      socket.send(JSON.stringify({ type: 'error', message: 'Insufficient permissions' }))
      return
    }
    const mutedSet = mutedUsers.get(groupId)
    if (mutedSet) {
      mutedSet.delete(targetUserId)
    }
    broadcastToGroupParticipants(groupId, { type: 'user_unmuted', userId: targetUserId })
  } catch (error) {
    console.error('[GroupChat] Unmute user error:', error)
  }
}

async function handleKickUser(socket: UserGroupChatSocket, payload: any) {
  try {
    const { groupId, targetUserId } = payload
    if (!socket.userId) return
    const session = activeSessions.get(groupId)
    const userRole = session?.participants.get(socket.userId)?.role
    if (userRole !== 'admin') {
      socket.send(JSON.stringify({ type: 'error', message: 'Only admins can kick users' }))
      return
    }
    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', targetUserId)
    session?.participants.delete(targetUserId)
    broadcastToGroupParticipants(groupId, { type: 'user_kicked', userId: targetUserId })
  } catch (error) {
    console.error('[GroupChat] Kick user error:', error)
  }
}

async function handlePromoteUser(socket: UserGroupChatSocket, payload: any) {
  try {
    const { groupId, targetUserId } = payload
    if (!socket.userId) return
    const session = activeSessions.get(groupId)
    const userRole = session?.participants.get(socket.userId)?.role
    if (userRole !== 'admin') {
      socket.send(JSON.stringify({ type: 'error', message: 'Only admins can promote users' }))
      return
    }
    await supabase
      .from('group_members')
      .update({ role: 'moderator' })
      .eq('group_id', groupId)
      .eq('user_id', targetUserId)
    const participant = session?.participants.get(targetUserId)
    if (participant) {
      participant.role = 'moderator'
    }
    broadcastToGroupParticipants(groupId, {
      type: 'user_promoted',
      userId: targetUserId,
      newRole: 'moderator'
    })
  } catch (error) {
    console.error('[GroupChat] Promote user error:', error)
  }
}

async function handleDemoteUser(socket: UserGroupChatSocket, payload: any) {
  try {
    const { groupId, targetUserId } = payload
    if (!socket.userId) return
    const session = activeSessions.get(groupId)
    const userRole = session?.participants.get(socket.userId)?.role
    if (userRole !== 'admin') {
      socket.send(JSON.stringify({ type: 'error', message: 'Only admins can demote users' }))
      return
    }
    await supabase
      .from('group_members')
      .update({ role: 'member' })
      .eq('group_id', groupId)
      .eq('user_id', targetUserId)
    const participant = session?.participants.get(targetUserId)
    if (participant) {
      participant.role = 'member'
    }
    broadcastToGroupParticipants(groupId, {
      type: 'user_demoted',
      userId: targetUserId,
      newRole: 'member'
    })
  } catch (error) {
    console.error('[GroupChat] Demote user error:', error)
  }
}

async function handleGetMessages(socket: UserGroupChatSocket, payload: any) {
  try {
    const { groupId, limit = 50, offset = 0 } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const { data: messages, error } = await supabase
      .from('group_chat_messages')
      .select('*')
      .eq('group_id', groupId)
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
    console.error('[GroupChat] Get messages error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to fetch messages' }))
  }
}

async function handleGetMembers(socket: UserGroupChatSocket, payload: any) {
  try {
    const { groupId } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const session = activeSessions.get(groupId)
    const members = Array.from(session?.participants.values() || [])
    socket.send(JSON.stringify({ type: 'members_list', members, count: members.length }))
  } catch (error) {
    console.error('[GroupChat] Get members error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to fetch members' }))
  }
}

function broadcastToGroupParticipants(groupId: string, message: any, excludeUserId?: string) {
  const session = activeSessions.get(groupId)
  if (session) {
    session.participants.forEach((participant) => {
      if (excludeUserId && participant.userId === excludeUserId) return
      console.log(`[GroupChat] Broadcasting to user ${participant.userId} in group ${groupId}`)
    })
  }
}
