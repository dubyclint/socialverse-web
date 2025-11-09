// controllers/groupChatController.js
const Chat = require('../models/chat');
const ChatMessage = require('../models/chatMessage');
const ChatParticipant = require('../models/chatParticipant');
const UserContact = require('../models/userContact');
const { User } = require('../models/user');
const { supabase } = require('../utils/supabase');
const { Op } = require('sequelize');
const gun = require('../utils/gunInstance');

class GroupChatController {
  // Create new group
  async createGroup(req, res) {
    try {
      const { 
        name, 
        description, 
        participantIds = [], 
        avatar,
        permissions = {} 
      } = req.body;
      const creatorId = req.user.id;

      // Validate group name
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Group name is required' 
        });
      }

      if (name.length > 50) {
        return res.status(400).json({ 
          success: false, 
          error: 'Group name must be 50 characters or less' 
        });
      }

      // Validate participants (must be user's pals)
      if (participantIds.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'At least one participant is required' 
        });
      }

      if (participantIds.length > 256) {
        return res.status(400).json({ 
          success: false, 
          error: 'Maximum 256 participants allowed' 
        });
      }

      // Verify all participants are user's pals
      const validParticipants = await this.validateGroupParticipants(creatorId, participantIds);
      
      if (validParticipants.length !== participantIds.length) {
        return res.status(400).json({ 
          success: false, 
          error: 'Some participants are not in your pal list' 
        });
      }

      // Default group permissions
      const defaultPermissions = {
        allowInvites: true,
        onlyAdminsCanMessage: false,
        onlyAdminsCanAddMembers: false,
        onlyAdminsCanRemoveMembers: true,
        onlyAdminsCanChangeGroupInfo: true,
        disappearingMessages: 'off',
        readReceipts: true,
        allowMemberExit: true,
        maxMembers: 256
      };

      const groupSettings = {
        ...defaultPermissions,
        ...permissions
      };

      // Create group chat
      const group = await Chat.create({
        type: 'group',
        name: name.trim(),
        description: description?.trim() || null,
        avatar: avatar || null,
        createdBy: creatorId,
        settings: groupSettings
      });

      // Add creator as owner
      await ChatParticipant.create({
        chatId: group.id,
        userId: creatorId,
        role: 'owner',
        joinedAt: new Date()
      });

      // Add participants as members
      const participantData = validParticipants.map(participantId => ({
        chatId: group.id,
        userId: participantId,
        role: 'member',
        joinedAt: new Date()
      }));

      await ChatParticipant.bulkCreate(participantData);

      // Create system message for group creation
      await ChatMessage.create({
        chatId: group.id,
        senderId: creatorId,
        content: `${req.user.username} created the group "${name}"`,
        messageType: 'system'
      });

      // Sync with Gun.js
      const gunGroup = gun.get('groups').get(group.id);
      gunGroup.put({
        id: group.id,
        name: group.name,
        description: group.description,
        avatar: group.avatar,
        createdBy: creatorId,
        createdAt: group.createdAt.toISOString(),
        participantCount: validParticipants.length + 1,
        settings: groupSettings
      });

      // Notify participants about group creation
      await this.notifyGroupCreation(group.id, creatorId, validParticipants, name);

      // Emit to Socket.io
      const allParticipants = [creatorId, ...validParticipants];
      allParticipants.forEach(participantId => {
        req.io.to(`user_${participantId}`).emit('group_created', {
          group: {
            ...group.toJSON(),
            participantCount: allParticipants.length
          }
        });
      });

      res.json({ 
        success: true, 
        group: {
          ...group.toJSON(),
          participantCount: allParticipants.length
        },
        message: 'Group created successfully!' 
      });

    } catch (error) {
      console.error('Create group error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Validate group participants are user's pals
  async validateGroupParticipants(userId, participantIds) {
    try {
      const { data: pals } = await supabase
        .from('pals')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted');

      const palIds = pals.map(pal => 
        pal.requester_id === userId ? pal.addressee_id : pal.requester_id
      );

      return participantIds.filter(id => palIds.includes(id));
    } catch (error) {
      console.error('Validate group participants error:', error);
      return [];
    }
  }

  // Add members to group
  async addMembers(req, res) {
    try {
      const { groupId } = req.params;
      const { memberIds } = req.body;
      const userId = req.user.id;

      // Verify user has permission to add members
      const userParticipant = await ChatParticipant.findOne({
        where: { chatId: groupId, userId, isActive: true }
      });

      if (!userParticipant) {
        return res.status(403).json({ 
          success: false, 
          error: 'You are not a member of this group' 
        });
      }

      const group = await Chat.findByPk(groupId);
      if (!group) {
        return res.status(404).json({ 
          success: false, 
          error: 'Group not found' 
        });
      }

      // Check permissions
      const canAddMembers = userParticipant.role === 'owner' || 
                           userParticipant.role === 'admin' || 
                           !group.settings.onlyAdminsCanAddMembers;

      if (!canAddMembers) {
        return res.status(403).json({ 
          success: false, 
          error: 'You do not have permission to add members' 
        });
      }

      // Check group member limit
      const currentMemberCount = await ChatParticipant.count({
        where: { chatId: groupId, isActive: true }
      });

      if (currentMemberCount + memberIds.length > group.settings.maxMembers) {
        return res.status(400).json({ 
          success: false, 
          error: `Group member limit (${group.settings.maxMembers}) would be exceeded` 
        });
      }

      // Validate new members are user's pals
      const validMembers = await this.validateGroupParticipants(userId, memberIds);
      
      if (validMembers.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'No valid members to add' 
        });
      }

      // Check if members are already in group
      const existingMembers = await ChatParticipant.findAll({
        where: { 
          chatId: groupId, 
          userId: { [Op.in]: validMembers },
          isActive: true 
        }
      });

      const existingMemberIds = existingMembers.map(m => m.userId);
      const newMemberIds = validMembers.filter(id => !existingMemberIds.includes(id));

      if (newMemberIds.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'All specified users are already group members' 
        });
      }

      // Add new members
      const newParticipants = newMemberIds.map(memberId => ({
        chatId: groupId,
        userId: memberId,
        role: 'member',
        joinedAt: new Date()
      }));

      await ChatParticipant.bulkCreate(newParticipants);

      // Get new member details
      const { data: newMemberDetails } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', newMemberIds);

      // Create system messages for each added member
      for (const member of newMemberDetails) {
        await ChatMessage.create({
          chatId: groupId,
          senderId: userId,
          content: `${req.user.username} added ${member.username} to the group`,
          messageType: 'system'
        });
      }

      // Update group's last message time
      await group.update({ lastMessageAt: new Date() });

      // Notify all group members
      await this.notifyMembersAdded(groupId, userId, newMemberDetails, group.name);

      // Emit to Socket.io
      req.io.to(`chat_${groupId}`).emit('members_added', {
        groupId,
        addedBy: req.user,
        newMembers: newMemberDetails
      });

      res.json({ 
        success: true, 
        addedMembers: newMemberDetails,
        message: `Added ${newMemberIds.length} members to the group` 
      });

    } catch (error) {
      console.error('Add members error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Remove member from group
  async removeMember(req, res) {
    try {
      const { groupId, memberId } = req.params;
      const userId = req.user.id;

      // Verify user has permission to remove members
      const userParticipant = await ChatParticipant.findOne({
        where: { chatId: groupId, userId, isActive: true }
      });

      if (!userParticipant) {
        return res.status(403).json({ 
          success: false, 
          error: 'You are not a member of this group' 
        });
      }

      const group = await Chat.findByPk(groupId);
      if (!group) {
        return res.status(404).json({ 
          success: false, 
          error: 'Group not found' 
        });
      }

      // Get member to be removed
      const memberParticipant = await ChatParticipant.findOne({
        where: { chatId: groupId, userId: memberId, isActive: true }
      });

      if (!memberParticipant) {
        return res.status(404).json({ 
          success: false, 
          error: 'Member not found in group' 
        });
      }

      // Check permissions
      const canRemoveMembers = userParticipant.role === 'owner' || 
                              (userParticipant.role === 'admin' && memberParticipant.role === 'member') ||
                              (!group.settings.onlyAdminsCanRemoveMembers && memberParticipant.role === 'member');

      // Users can always remove themselves
      const isSelfRemoval = userId === memberId;

      if (!canRemoveMembers && !isSelfRemoval) {
        return res.status(403).json({ 
          success: false, 
          error: 'You do not have permission to remove this member' 
        });
      }

      // Cannot remove group owner
      if (memberParticipant.role === 'owner' && !isSelfRemoval) {
        return res.status(403).json({ 
          success: false, 
          error: 'Cannot remove group owner' 
        });
      }

      // Remove member
      await memberParticipant.update({ isActive: false });

      // Get member details
      const { data: memberDetails } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', memberId)
        .single();

      // Create system message
      const systemMessage = isSelfRemoval 
        ? `${memberDetails.username} left the group`
        : `${req.user.username} removed ${memberDetails.username} from the group`;

      await ChatMessage.create({
        chatId: groupId,
        senderId: userId,
        content: systemMessage,
        messageType: 'system'
      });

      // Update group's last message time
      await group.update({ lastMessageAt: new Date() });

      // If owner leaves, transfer ownership to oldest admin or member
      if (memberParticipant.role === 'owner') {
        await this.transferGroupOwnership(groupId);
      }

      // Notify group members
      await this.notifyMemberRemoved(groupId, userId, memberDetails, group.name, isSelfRemoval);

      // Emit to Socket.io
      req.io.to(`chat_${groupId}`).emit('member_removed', {
        groupId,
        removedBy: isSelfRemoval ? null : req.user,
        removedMember: { id: memberId, ...memberDetails },
        isSelfRemoval
      });

      res.json({ 
        success: true, 
        message: isSelfRemoval ? 'Left group successfully' : 'Member removed successfully' 
      });

    } catch (error) {
      console.error('Remove member error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Transfer group ownership
  async transferGroupOwnership(groupId) {
    try {
      // Find next suitable owner (admin first, then oldest member)
      const nextOwner = await ChatParticipant.findOne({
        where: { chatId: groupId, isActive: true, role: { [Op.in]: ['admin', 'member'] } },
        order: [
          ['role', 'ASC'], // admin comes before member
          ['joinedAt', 'ASC'] // oldest first
        ]
      });

      if (nextOwner) {
        await nextOwner.update({ role: 'owner' });
        
        // Create system message
        const { data: newOwner } = await supabase
          .from('users')
          .select('username')
          .eq('id', nextOwner.userId)
          .single();

        await ChatMessage.create({
          chatId: groupId,
          senderId: nextOwner.userId,
          content: `${newOwner.username} is now the group owner`,
          messageType: 'system'
        });
      }
    } catch (error) {
      console.error('Transfer group ownership error:', error);
    }
  }

  // Promote/Demote member
  async changeRole(req, res) {
    try {
      const { groupId, memberId } = req.params;
      const { role } = req.body; // 'admin' | 'member'
      const userId = req.user.id;

      if (!['admin', 'member'].includes(role)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid role. Use "admin" or "member"' 
        });
      }

      // Verify user is group owner
      const userParticipant = await ChatParticipant.findOne({
        where: { chatId: groupId, userId, role: 'owner', isActive: true }
      });

      if (!userParticipant) {
        return res.status(403).json({ 
          success: false, 
          error: 'Only group owner can change member roles' 
        });
      }

      // Get member to change
      const memberParticipant = await ChatParticipant.findOne({
        where: { chatId: groupId, userId: memberId, isActive: true }
      });

      if (!memberParticipant) {
        return res.status(404).json({ 
          success: false, 
          error: 'Member not found in group' 
        });
      }

      if (memberParticipant.role === 'owner') {
        return res.status(403).json({ 
          success: false, 
          error: 'Cannot change owner role' 
        });
      }

      // Update role
      await memberParticipant.update({ role });

      // Get member details
      const { data: memberDetails } = await supabase
        .from('users')
        .select('username')
        .eq('id', memberId)
        .single();

      // Create system message
      const action = role === 'admin' ? 'promoted' : 'demoted';
      await ChatMessage.create({
        chatId: groupId,
        senderId: userId,
        content: `${req.user.username} ${action} ${memberDetails.username} ${role === 'admin' ? 'to admin' : 'to member'}`,
        messageType: 'system'
      });

      // Emit to Socket.io
      req.io.to(`chat_${groupId}`).emit('member_role_changed', {
        groupId,
        memberId,
        newRole: role,
        changedBy: req.user
      });

      res.json({ 
        success: true, 
        message: `Member ${action} successfully` 
      });

    } catch (error) {
      console.error('Change role error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Update group info
  async updateGroupInfo(req, res) {
    try {
      const { groupId } = req.params;
      const { name, description, avatar } = req.body;
      const userId = req.user.id;

      // Verify user has permission to change group info
      const userParticipant = await ChatParticipant.findOne({
        where: { chatId: groupId, userId, isActive: true }
      });

      if (!userParticipant) {
        return res.status(403).json({ 
          success: false, 
          error: 'You are not a member of this group' 
        });
      }

      const group = await Chat.findByPk(groupId);
      if (!group) {
        return res.status(404).json({ 
          success: false, 
          error: 'Group not found' 
        });
      }

      // Check permissions
      const canChangeInfo = userParticipant.role === 'owner' || 
                           userParticipant.role === 'admin' || 
                           !group.settings.onlyAdminsCanChangeGroupInfo;

      if (!canChangeInfo) {
        return res.status(403).json({ 
          success: false, 
          error: 'You do not have permission to change group info' 
        });
      }

      // Validate name
      if (name && (name.trim().length === 0 || name.length > 50)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Group name must be 1-50 characters' 
        });
      }

      // Update group
      const updates = {};
      if (name !== undefined) updates.name = name.trim();
      if (description !== undefined) updates.description = description?.trim() || null;
      if (avatar !== undefined) updates.avatar = avatar;

      await group.update(updates);

      // Create system message for changes
      const changes = [];
      if (name && name !== group.name) changes.push(`name to "${name}"`);
      if (description !== undefined) changes.push('description');
      if (avatar !== undefined) changes.push('group photo');

      if (changes.length > 0) {
        await ChatMessage.create({
          chatId: groupId,
          senderId: userId,
          content: `${req.user.username} changed group ${changes.join(', ')}`,
          messageType: 'system'
        });
      }

      // Sync with Gun.js
      const gunGroup = gun.get('groups').get(groupId);
      gunGroup.put({
        name: group.name,
        description: group.description,
        avatar: group.avatar,
        updatedAt: new Date().toISOString()
      });

      // Emit to Socket.io
      req.io.to(`chat_${groupId}`).emit('group_info_updated', {
        groupId,
        updates,
        updatedBy: req.user
      });

      res.json({ 
        success: true, 
        group,
        message: 'Group info updated successfully' 
      });

    } catch (error) {
      console.error('Update group info error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Update group settings
  async updateGroupSettings(req, res) {
    try {
      const { groupId } = req.params;
      const { settings } = req.body;
      const userId = req.user.id;

      // Verify user is group owner or admin
      const userParticipant = await ChatParticipant.findOne({
        where: { 
          chatId: groupId, 
          userId, 
          role: { [Op.in]: ['owner', 'admin'] },
          isActive: true 
        }
      });

      if (!userParticipant) {
        return res.status(403).json({ 
          success: false, 
          error: 'Only group owners and admins can change settings' 
        });
      }

      const group = await Chat.findByPk(groupId);
      if (!group) {
        return res.status(404).json({ 
          success: false, 
          error: 'Group not found' 
        });
      }

      // Validate settings
      const validSettings = [
        'allowInvites', 'onlyAdminsCanMessage', 'onlyAdminsCanAddMembers',
        'onlyAdminsCanRemoveMembers', 'onlyAdminsCanChangeGroupInfo',
        'disappearingMessages', 'readReceipts', 'allowMemberExit', 'maxMembers'
      ];

      const filteredSettings = {};
      for (const [key, value] of Object.entries(settings)) {
        if (validSettings.includes(key)) {
          filteredSettings[key] = value;
        }
      }

      // Update settings
      const newSettings = { ...group.settings, ...filteredSettings };
      await group.update({ settings: newSettings });

      // Create system message
      await ChatMessage.create({
        chatId: groupId,
        senderId: userId,
        content: `${req.user.username} updated group settings`,
        messageType: 'system'
      });

      // Emit to Socket.io
      req.io.to(`chat_${groupId}`).emit('group_settings_updated', {
        groupId,
        settings: newSettings,
        updatedBy: req.user
      });

      res.json({ 
        success: true, 
        settings: newSettings,
        message: 'Group settings updated successfully' 
      });

    } catch (error) {
      console.error('Update group settings error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get group details
  async getGroupDetails(req, res) {
    try {
      const { groupId } = req.params;
      const userId = req.user.id;

      // Verify user is group member
      const userParticipant = await ChatParticipant.findOne({
        where: { chatId: groupId, userId, isActive: true }
      });

      if (!userParticipant) {
        return res.status(403).json({ 
          success: false, 
          error: 'You are not a member of this group' 
        });
      }

      // Get group with participants
      const group = await Chat.findOne({
        where: { id: groupId, type: 'group' },
        include: [{
          model: ChatParticipant,
          where: { isActive: true },
          include: [{
            model: User,
            attributes: ['id', 'username', 'avatar', 'isOnline', 'lastSeen', 'isVerified']
          }],
          order: [['role', 'ASC'], ['joinedAt', 'ASC']]
        }]
      });

      if (!group) {
        return res.status(404).json({ 
          success: false, 
          error: 'Group not found' 
        });
      }

      // Get unread message count for user
      const unreadCount = await ChatMessage.count({
        where: {
          chatId: groupId,
          createdAt: { [Op.gt]: userParticipant.lastReadAt },
          senderId: { [Op.ne]: userId }
        }
      });

      res.json({ 
        success: true, 
        group: {
          ...group.toJSON(),
          unreadCount,
          userRole: userParticipant.role,
          userJoinedAt: userParticipant.joinedAt
        }
      });

    } catch (error) {
      console.error('Get group details error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get user's groups
  async getUserGroups(req, res) {
    try {
      const userId = req.user.id;

      const groups = await Chat.findAll({
        where: { type: 'group' },
        include: [
          {
            model: ChatParticipant,
            where: { userId, isActive: true },
            include: [{
              model: User,
              attributes: ['id', 'username', 'avatar']
            }]
          },
          {
            model: ChatMessage,
            limit: 1,
            order: [['createdAt', 'DESC']],
            include: [{
              model: User,
              attributes: ['username']
            }]
          }
        ],
        order: [['lastMessageAt', 'DESC']]
      });

      // Calculate unread counts and participant counts
      const groupsWithDetails = await Promise.all(groups.map(async (group) => {
        const participant = group.ChatParticipants[0];
        
        const [unreadCount, participantCount] = await Promise.all([
          ChatMessage.count({
            where: {
              chatId: group.id,
              createdAt: { [Op.gt]: participant.lastReadAt },
              senderId: { [Op.ne]: userId }
            }
          }),
          ChatParticipant.count({
            where: { chatId: group.id, isActive: true }
          })
        ]);

        return {
          ...group.toJSON(),
          unreadCount,
          participantCount,
          userRole: participant.role,
          lastRead: participant.lastReadAt
        };
      }));

      res.json({ success: true, groups: groupsWithDetails });

    } catch (error) {
      console.error('Get user groups error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Notification helpers
  async notifyGroupCreation(groupId, creatorId, participantIds, groupName) {
    try {
      const { data: creator } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', creatorId)
        .single();

      const notifications = participantIds.map(participantId => ({
        user_id: participantId,
        type: 'group_invitation',
        title: 'Added to Group',
        message: `${creator.username} added you to "${groupName}"`,
        data: {
          groupId,
          groupName,
          creatorId,
          creatorUsername: creator.username,
          creatorAvatar: creator.avatar_url
        }
      }));

      await supabase.from('notifications').insert(notifications);

    } catch (error) {
      console.error('Notify group creation error:', error);
    }
  }

  async notifyMembersAdded(groupId, adderId, newMembers, groupName) {
    try {
      const { data: adder } = await supabase
        .from('users')
        .select('username')
        .eq('id', adderId)
        .single();

      // Notify new members
      const newMemberNotifications = newMembers.map(member => ({
        user_id: member.id,
        type: 'group_invitation',
        title: 'Added to Group',
        message: `${adder.username} added you to "${groupName}"`,
        data: { groupId, groupName, adderId }
      }));

      await supabase.from('notifications').insert(newMemberNotifications);

    } catch (error) {
      console.error('Notify members added error:', error);
    }
  }

  async notifyMemberRemoved(groupId, removerId, removedMember, groupName, isSelfRemoval) {
    try {
      if (!isSelfRemoval) {
        // Notify removed member
        const { data: remover } = await supabase
          .from('users')
          .select('username')
          .eq('id', removerId)
          .single();

        await supabase
          .from('notifications')
          .insert([{
            user_id: removedMember.id,
            type: 'group_removal',
            title: 'Removed from Group',
            message: `${remover.username} removed you from "${groupName}"`,
            data: { groupId, groupName, removerId }
          }]);
      }
    } catch (error) {
      console.error('Notify member removed error:', error);
    }
  }
}

module.exports = new GroupChatController();
