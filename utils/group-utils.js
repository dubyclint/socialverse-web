// utils/groupUtils.js
const ChatParticipant = require('../models/chatParticipant');
const Chat = require('../models/chat');
const { Op } = require('sequelize');

class GroupUtils {
  // Generate group invite link
  static generateInviteLink(groupId, inviterId, expiresIn = '7d') {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store invite token in database with expiration
    // This is a simplified version - implement proper invite token storage
    return {
      inviteLink: `https://socialverse.app/join/${token}`,
      token,
      expiresAt: this.getExpirationDate(expiresIn)
    };
  }

  // Get expiration date
  static getExpirationDate(expiresIn) {
    const now = new Date();
    
    switch (expiresIn) {
      case '1h': return new Date(now.getTime() + 60 * 60 * 1000);
      case '24h': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }

  // Format group member list for display
  static async formatGroupMembers(groupId) {
    try {
      const participants = await ChatParticipant.findAll({
        where: { chatId: groupId, isActive: true },
        include: [{
          model: User,
          attributes: ['id', 'username', 'avatar', 'isOnline', 'lastSeen', 'isVerified']
        }],
        order: [
          ['role', 'ASC'], // owner, admin, member
          ['joinedAt', 'ASC']
        ]
      });

      return participants.map(participant => ({
        ...participant.User.toJSON(),
        role: participant.role,
        joinedAt: participant.joinedAt,
        isOnline: participant.User.isOnline,
        lastSeen: participant.User.lastSeen
      }));

    } catch (error) {
      console.error('Format group members error:', error);
      return [];
    }
  }

  // Get group statistics
  static async getGroupStats(groupId) {
    try {
      const [memberCount, messageCount, activeMembers] = await Promise.all([
        ChatParticipant.count({
          where: { chatId: groupId, isActive: true }
        }),
        ChatMessage.count({
          where: { chatId: groupId, isDeleted: false }
        }),
        ChatParticipant.count({
          where: { 
            chatId: groupId, 
            isActive: true,
            lastReadAt: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        })
      ]);

      return {
        memberCount,
        messageCount,
        activeMembers,
        activityRate: memberCount > 0 ? (activeMembers / memberCount * 100).toFixed(1) : 0
      };

    } catch (error) {
      console.error('Get group stats error:', error);
      return {
        memberCount: 0,
        messageCount: 0,
        activeMembers: 0,
        activityRate: 0
      };
    }
  }

  // Check group name availability
  static async isGroupNameAvailable(name, excludeGroupId = null) {
    try {
      const whereClause = { 
        name: name.trim(),
        type: 'group',
        isActive: true 
      };

      if (excludeGroupId) {
        whereClause.id = { [Op.ne]: excludeGroupId };
      }

      const existingGroup = await Chat.findOne({ where: whereClause });
      return !existingGroup;

    } catch (error) {
      console.error('Check group name availability error:', error);
      return false;
    }
  }

  // Suggest group names
  static suggestGroupNames(baseName, existingNames = []) {
    const suggestions = [];
    const base = baseName.trim();

    // Add numbers
    for (let i = 2; i <= 10; i++) {
      const suggestion = `${base} ${i}`;
      if (!existingNames.includes(suggestion)) {
        suggestions.push(suggestion);
      }
    }

    // Add descriptive suffixes
    const suffixes = ['Chat', 'Group', 'Team', 'Squad', 'Crew', 'Gang'];
    for (const suffix of suffixes) {
      const suggestion = `${base} ${suffix}`;
      if (!existingNames.includes(suggestion)) {
        suggestions.push(suggestion);
      }
    }

    return suggestions.slice(0, 5);
  }

  // Validate group creation data
  static validateGroupCreation(data) {
    const errors = [];

    // Validate name
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Group name is required');
    } else if (data.name.length > 50) {
      errors.push('Group name must be 50 characters or less');
    }

    // Validate description
    if (data.description && data.description.length > 500) {
      errors.push('Group description must be 500 characters or less');
    }

    // Validate participants
    if (!data.participantIds || !Array.isArray(data.participantIds)) {
      errors.push('Participant IDs must be an array');
    } else if (data.participantIds.length === 0) {
      errors.push('At least one participant is required');
    } else if (data.participantIds.length > 256) {
      errors.push('Maximum 256 participants allowed');
    }

    // Validate permissions
    if (data.permissions) {
      const permissionValidation = require('../services/groupPermissionsService')
        .validateGroupSettings(data.permissions);
      
      if (!permissionValidation.isValid) {
        errors.push(...permissionValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Format group for API response
  static formatGroupResponse(group, userRole = null, unreadCount = 0) {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      avatar: group.avatar,
      type: group.type,
      createdBy: group.createdBy,
      createdAt: group.createdAt,
      lastMessageAt: group.lastMessageAt,
      settings: group.settings,
      userRole,
      unreadCount,
      isActive: group.isActive
    };
  }
}

module.exports = GroupUtils;
