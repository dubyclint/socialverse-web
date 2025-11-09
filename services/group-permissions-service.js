// services/groupPermissionsService.js
const ChatParticipant = require('../models/chatParticipant');
const Chat = require('../models/chat');

class GroupPermissionsService {
  // Standard group permission templates
  static getPermissionTemplates() {
    return {
      open: {
        name: 'Open Group',
        description: 'Anyone can message, add members, and change basic info',
        permissions: {
          allowInvites: true,
          onlyAdminsCanMessage: false,
          onlyAdminsCanAddMembers: false,
          onlyAdminsCanRemoveMembers: false,
          onlyAdminsCanChangeGroupInfo: false,
          disappearingMessages: 'off',
          readReceipts: true,
          allowMemberExit: true,
          maxMembers: 256
        }
      },
      moderated: {
        name: 'Moderated Group',
        description: 'Only admins can add/remove members and change group info',
        permissions: {
          allowInvites: true,
          onlyAdminsCanMessage: false,
          onlyAdminsCanAddMembers: true,
          onlyAdminsCanRemoveMembers: true,
          onlyAdminsCanChangeGroupInfo: true,
          disappearingMessages: 'off',
          readReceipts: true,
          allowMemberExit: true,
          maxMembers: 256
        }
      },
      restricted: {
        name: 'Restricted Group',
        description: 'Only admins can message and manage the group',
        permissions: {
          allowInvites: false,
          onlyAdminsCanMessage: true,
          onlyAdminsCanAddMembers: true,
          onlyAdminsCanRemoveMembers: true,
          onlyAdminsCanChangeGroupInfo: true,
          disappearingMessages: 'off',
          readReceipts: true,
          allowMemberExit: false,
          maxMembers: 256
        }
      },
      announcement: {
        name: 'Announcement Group',
        description: 'Only admins can send messages, members can only read',
        permissions: {
          allowInvites: false,
          onlyAdminsCanMessage: true,
          onlyAdminsCanAddMembers: true,
          onlyAdminsCanRemoveMembers: true,
          onlyAdminsCanChangeGroupInfo: true,
          disappearingMessages: 'off',
          readReceipts: false,
          allowMemberExit: true,
          maxMembers: 1000
        }
      }
    };
  }

  // Check if user can perform action in group
  async checkPermission(userId, groupId, action) {
    try {
      const participant = await ChatParticipant.findOne({
        where: { chatId: groupId, userId, isActive: true }
      });

      if (!participant) {
        return { allowed: false, reason: 'Not a group member' };
      }

      const group = await Chat.findByPk(groupId);
      if (!group) {
        return { allowed: false, reason: 'Group not found' };
      }

      const { role } = participant;
      const { settings } = group;

      switch (action) {
        case 'send_message':
          if (settings.onlyAdminsCanMessage && !['owner', 'admin'].includes(role)) {
            return { allowed: false, reason: 'Only admins can send messages' };
          }
          break;

        case 'add_members':
          if (settings.onlyAdminsCanAddMembers && !['owner', 'admin'].includes(role)) {
            return { allowed: false, reason: 'Only admins can add members' };
          }
          break;

        case 'remove_members':
          if (settings.onlyAdminsCanRemoveMembers && !['owner', 'admin'].includes(role)) {
            return { allowed: false, reason: 'Only admins can remove members' };
          }
          break;

        case 'change_group_info':
          if (settings.onlyAdminsCanChangeGroupInfo && !['owner', 'admin'].includes(role)) {
            return { allowed: false, reason: 'Only admins can change group info' };
          }
          break;

        case 'change_settings':
          if (!['owner', 'admin'].includes(role)) {
            return { allowed: false, reason: 'Only admins can change settings' };
          }
          break;

        case 'promote_demote':
          if (role !== 'owner') {
            return { allowed: false, reason: 'Only owner can change member roles' };
          }
          break;

        case 'leave_group':
          if (!settings.allowMemberExit && role !== 'owner') {
            return { allowed: false, reason: 'Members cannot leave this group' };
          }
          break;

        default:
          return { allowed: false, reason: 'Unknown action' };
      }

      return { allowed: true, role };

    } catch (error) {
      console.error('Check permission error:', error);
      return { allowed: false, reason: 'Permission check failed' };
    }
  }

  // Get user's role in group
  async getUserRole(userId, groupId) {
    try {
      const participant = await ChatParticipant.findOne({
        where: { chatId: groupId, userId, isActive: true },
        attributes: ['role', 'joinedAt']
      });

      return participant ? participant.role : null;
    } catch (error) {
      console.error('Get user role error:', error);
      return null;
    }
  }

  // Check if user can remove specific member
  async canRemoveMember(removerId, groupId, targetMemberId) {
    try {
      const [removerParticipant, targetParticipant] = await Promise.all([
        ChatParticipant.findOne({
          where: { chatId: groupId, userId: removerId, isActive: true }
        }),
        ChatParticipant.findOne({
          where: { chatId: groupId, userId: targetMemberId, isActive: true }
        })
      ]);

      if (!removerParticipant || !targetParticipant) {
        return { allowed: false, reason: 'Member not found' };
      }

      // Self removal is always allowed (unless restricted)
      if (removerId === targetMemberId) {
        const group = await Chat.findByPk(groupId);
        if (!group.settings.allowMemberExit && removerParticipant.role !== 'owner') {
          return { allowed: false, reason: 'Cannot leave this group' };
        }
        return { allowed: true, reason: 'Self removal' };
      }

      // Owner can remove anyone except other owners
      if (removerParticipant.role === 'owner' && targetParticipant.role !== 'owner') {
        return { allowed: true, reason: 'Owner privilege' };
      }

      // Admin can remove members only
      if (removerParticipant.role === 'admin' && targetParticipant.role === 'member') {
        return { allowed: true, reason: 'Admin privilege' };
      }

      return { allowed: false, reason: 'Insufficient privileges' };

    } catch (error) {
      console.error('Can remove member error:', error);
      return { allowed: false, reason: 'Permission check failed' };
    }
  }

  // Validate group settings
  validateGroupSettings(settings) {
    const errors = [];
    const validSettings = {
      allowInvites: 'boolean',
      onlyAdminsCanMessage: 'boolean',
      onlyAdminsCanAddMembers: 'boolean',
      onlyAdminsCanRemoveMembers: 'boolean',
      onlyAdminsCanChangeGroupInfo: 'boolean',
      disappearingMessages: ['off', '24h', '7d', '60d'],
      readReceipts: 'boolean',
      allowMemberExit: 'boolean',
      maxMembers: 'number'
    };

    for (const [key, value] of Object.entries(settings)) {
      if (!validSettings.hasOwnProperty(key)) {
        errors.push(`Unknown setting: ${key}`);
        continue;
      }

      const expectedType = validSettings[key];
      
      if (Array.isArray(expectedType)) {
        if (!expectedType.includes(value)) {
          errors.push(`Invalid value for ${key}. Expected one of: ${expectedType.join(', ')}`);
        }
      } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${key} must be a boolean`);
      } else if (expectedType === 'number' && typeof value !== 'number') {
        errors.push(`${key} must be a number`);
      }
    }

    // Validate maxMembers range
    if (settings.maxMembers && (settings.maxMembers < 2 || settings.maxMembers > 1000)) {
      errors.push('maxMembers must be between 2 and 1000');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new GroupPermissionsService();
