// server/controllers/group-chat-controller.ts - Group Chat Management
// ============================================================================

import type { H3Event } from 'h3'
import { getRouterParam, getQuery, readBody } from 'h3'
import { Chat } from '../models/chat-models'
import { ChatMessage } from '../models/chat-models'
import { ChatParticipant } from '../models/chat-models'
import { UserContact } from '../models/user-contact'
import { User } from '../models/profile'
import { supabase } from '../utils/supabase'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface GroupData {
  id: string
  name: string
  description?: string
  avatar?: string
  creator_id: string
  created_at: string
  updated_at: string
}

export interface ParticipantData {
  id: string
  group_id: string
  user_id: string
  role: 'admin' | 'moderator' | 'member'
  joined_at: string
}

export interface ChatResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

// ============================================================================
// GROUP CHAT CONTROLLER
// ============================================================================

export class GroupChatController {
  /**
   * Create new group
   * POST /api/group-chat
   */
  static async createGroup(event: H3Event): Promise<ChatResponse> {
    try {
      const userId = event.context.user?.id
      const body = await readBody(event)
      const {
        name,
        description,
        participantIds = [],
        avatar,
        permissions = {}
      } = body

      if (!userId) {
        return {
          success: false,
          message: 'Authentication required'
        }
      }

      // Validate group name
      if (!name || name.trim().length === 0) {
        return {
          success: false,
          error: 'Group name is required'
        }
      }

      if (name.length > 50) {
        return {
          success: false,
          error: 'Group name must be 50 characters or less'
        }
      }

      // Create group
      const group = await Chat.create({
        name,
        description,
        avatar,
        creator_id: userId,
        is_group: true,
        permissions,
        created_at: new Date().toISOString()
      })

      // Add creator as admin
      await ChatParticipant.create({
        chat_id: group.id,
        user_id: userId,
        role: 'admin',
        joined_at: new Date().toISOString()
      })

      // Add other participants
      for (const participantId of participantIds) {
        if (participantId !== userId) {
          await ChatParticipant.create({
            chat_id: group.id,
            user_id: participantId,
            role: 'member',
            joined_at: new Date().toISOString()
          })
        }
      }

      return {
        success: true,
        data: group,
        message: 'Group created successfully'
      }
    } catch (error) {
      console.error('Error creating group:', error)
      return {
        success: false,
        message: 'Error creating group'
      }
    }
  }

  /**
   * Get group details
   * GET /api/group-chat/:groupId
   */
  static async getGroupDetails(event: H3Event): Promise<ChatResponse> {
    try {
      const groupId = getRouterParam(event, 'groupId')

      const group = await Chat.findOne({
        where: { id: groupId, is_group: true }
      })

      if (!group) {
        return {
          success: false,
          message: 'Group not found'
        }
      }

      const participants = await ChatParticipant.findAll({
        where: { chat_id: groupId }
      })

      return {
        success: true,
        data: {
          group,
          participants,
          participantCount: participants.length
        }
      }
    } catch (error) {
      console.error('Error getting group details:', error)
      return {
        success: false,
        message: 'Error retrieving group details'
      }
    }
  }

  /**
   * Add participant to group
   * POST /api/group-chat/:groupId/participants
   */
  static async addParticipant(event: H3Event): Promise<ChatResponse> {
    try {
      const userId = event.context.user?.id
      const groupId = getRouterParam(event, 'groupId')
      const body = await readBody(event)
      const { participantId } = body

      if (!userId) {
        return {
          success: false,
          message: 'Authentication required'
        }
      }

      // Verify user is admin
      const adminCheck = await ChatParticipant.findOne({
        where: {
          chat_id: groupId,
          user_id: userId,
          role: 'admin'
        }
      })

      if (!adminCheck) {
        return {
          success: false,
          error: 'Only admins can add participants'
        }
      }

      // Check if already participant
      const existing = await ChatParticipant.findOne({
        where: {
          chat_id: groupId,
          user_id: participantId
        }
      })

      if (existing) {
        return {
          success: false,
          error: 'User is already a participant'
        }
      }

      // Add participant
      const participant = await ChatParticipant.create({
        chat_id: groupId,
        user_id: participantId,
        role: 'member',
        joined_at: new Date().toISOString()
      })

      return {
        success: true,
        data: participant,
        message: 'Participant added successfully'
      }
    } catch (error) {
      console.error('Error adding participant:', error)
      return {
        success: false,
        message: 'Error adding participant'
      }
    }
  }

  /**
   * Remove participant from group
   * DELETE /api/group-chat/:groupId/participants/:participantId
   */
  static async removeParticipant(event: H3Event): Promise<ChatResponse> {
    try {
      const userId = event.context.user?.id
      const groupId = getRouterParam(event, 'groupId')
      const participantId = getRouterParam(event, 'participantId')

      if (!userId) {
        return {
          success: false,
          message: 'Authentication required'
        }
      }

      // Verify user is admin
      const adminCheck = await ChatParticipant.findOne({
        where: {
          chat_id: groupId,
          user_id: userId,
          role: 'admin'
        }
      })

      if (!adminCheck) {
        return {
          success: false,
          error: 'Only admins can remove participants'
        }
      }

      await ChatParticipant.destroy({
        where: {
          chat_id: groupId,
          user_id: participantId
        }
      })

      return {
        success: true,
        message: 'Participant removed successfully'
      }
    } catch (error) {
      console.error('Error removing participant:', error)
      return {
        success: false,
        message: 'Error removing participant'
      }
    }
  }

  /**
   * Send message to group
   * POST /api/group-chat/:groupId/messages
   */
  static async sendMessage(event: H3Event): Promise<ChatResponse> {
    try {
      const userId = event.context.user?.id
      const groupId = getRouterParam(event, 'groupId')
      const body = await readBody(event)
      const { content, attachments = [] } = body

      if (!userId) {
        return {
          success: false,
          message: 'Authentication required'
        }
      }

      if (!content || content.trim().length === 0) {
        return {
          success: false,
          error: 'Message content is required'
        }
      }

      // Verify user is participant
      const participant = await ChatParticipant.findOne({
        where: {
          chat_id: groupId,
          user_id: userId
        }
      })

      if (!participant) {
        return {
          success: false,
          error: 'You are not a participant of this group'
        }
      }

      // Create message
      const message = await ChatMessage.create({
        chat_id: groupId,
        sender_id: userId,
        content,
        attachments,
        created_at: new Date().toISOString()
      })

      return {
        success: true,
        data: message,
        message: 'Message sent successfully'
      }
    } catch (error) {
      console.error('Error sending message:', error)
      return {
        success: false,
        message: 'Error sending message'
      }
    }
  }

  /**
   * Get group messages
   * GET /api/group-chat/:groupId/messages
   */
  static async getMessages(event: H3Event): Promise<ChatResponse> {
    try {
      const groupId = getRouterParam(event, 'groupId')
      const query = getQuery(event)
      const limit = parseInt(query.limit as string) || 50
      const offset = parseInt(query.offset as string) || 0

      const messages = await ChatMessage.findAll({
        where: { chat_id: groupId },
        limit,
        offset,
        order: [['created_at', 'DESC']]
      })

      return {
        success: true,
        data: {
          messages,
          total: messages.length
        }
      }
    } catch (error) {
      console.error('Error getting messages:', error)
      return {
        success: false,
        message: 'Error retrieving messages'
      }
    }
  }

  /**
   * Update group
   * PATCH /api/group-chat/:groupId
   */
  static async updateGroup(event: H3Event): Promise<ChatResponse> {
    try {
      const userId = event.context.user?.id
      const groupId = getRouterParam(event, 'groupId')
      const body = await readBody(event)
      const { name, description, avatar } = body

      if (!userId) {
        return {
          success: false,
          message: 'Authentication required'
        }
      }

      // Verify user is admin
      const adminCheck = await ChatParticipant.findOne({
        where: {
          chat_id: groupId,
          user_id: userId,
          role: 'admin'
        }
      })

      if (!adminCheck) {
        return {
          success: false,
          error: 'Only admins can update group'
        }
      }

      const updated = await Chat.update(
        { name, description, avatar, updated_at: new Date().toISOString() },
        { where: { id: groupId } }
      )

      return {
        success: true,
        data: updated,
        message: 'Group updated successfully'
      }
    } catch (error) {
      console.error('Error updating group:', error)
      return {
        success: false,
        message: 'Error updating group'
      }
    }
  }

  /**
   * Delete group
   * DELETE /api/group-chat/:groupId
   */
  static async deleteGroup(event: H3Event): Promise<ChatResponse> {
    try {
      const userId = event.context.user?.id
      const groupId = getRouterParam(event, 'groupId')

      if (!userId) {
        return {
          success: false,
          message: 'Authentication required'
        }
      }

      // Verify user is creator/admin
      const group = await Chat.findOne({
        where: { id: groupId }
      })

      if (group?.creator_id !== userId) {
        return {
          success: false,
          error: 'Only group creator can delete group'
        }
      }

      await Chat.destroy({
        where: { id: groupId }
      })

      return {
        success: true,
        message: 'Group deleted successfully'
      }
    } catch (error) {
      console.error('Error deleting group:', error)
      return {
        success: false,
        message: 'Error deleting group'
      }
    }
  }
}
