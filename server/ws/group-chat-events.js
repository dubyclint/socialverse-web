// server/ws/groupChatEvents.js
const ChatParticipant = require('../../models/chatParticipant');
const groupPermissionsService = require('../../services/groupPermissionsService');

class GroupChatEvents {
  static setupGroupEvents(io, socket) {
    // Join group room
    socket.on('join_group', async (data) => {
      try {
        const { groupId } = data;
        const userId = socket.userId;

        // Verify user is group member
        const participant = await ChatParticipant.findOne({
          where: { chatId: groupId, userId, isActive: true }
        });

        if (participant) {
          socket.join(`chat_${groupId}`);
          socket.emit('joined_group', { groupId, success: true });
          
          // Notify other members user is online in group
          socket.to(`chat_${groupId}`).emit('user_joined_group', {
            groupId,
            userId,
            username: socket.username
          });
        } else {
          socket.emit('joined_group', { 
            groupId, 
            success: false, 
            error: 'Not a group member' 
          });
        }

      } catch (error) {
        console.error('Join group error:', error);
        socket.emit('joined_group', { 
          groupId: data.groupId, 
          success: false, 
          error: 'Failed to join group' 
        });
      }
    });

    // Leave group room
    socket.on('leave_group', async (data) => {
      try {
        const { groupId } = data;
        socket.leave(`chat_${groupId}`);
        
        // Notify other members user left group
        socket.to(`chat_${groupId}`).emit('user_left_group', {
          groupId,
          userId: socket.userId,
          username: socket.username
        });

      } catch (error) {
        console.error('Leave group error:', error);
      }
    });

    // Group typing indicator
    socket.on('group_typing', async (data) => {
      try {
        const { groupId, isTyping } = data;
        const userId = socket.userId;

        // Verify user can send messages in group
        const permission = await groupPermissionsService.checkPermission(
          userId, groupId, 'send_message'
        );

        if (permission.allowed) {
          socket.to(`chat_${groupId}`).emit('user_typing', {
            groupId,
            userId,
            username: socket.username,
            isTyping
          });
        }

      } catch (error) {
        console.error('Group typing error:', error);
      }
    });

    // Group message reactions
    socket.on('group_message_reaction', async (data) => {
      try {
        const { groupId, messageId, reaction, action } = data; // action: 'add' | 'remove'
        const userId = socket.userId;

        // Verify user is group member
        const participant = await ChatParticipant.findOne({
          where: { chatId: groupId, userId, isActive: true }
        });

        if (participant) {
          // Broadcast reaction to group members
          socket.to(`chat_${groupId}`).emit('message_reaction', {
            groupId,
            messageId,
            userId,
            username: socket.username,
            reaction,
            action
          });
        }

      } catch (error) {
        console.error('Group message reaction error:', error);
      }
    });

    // Group voice/video call events
    socket.on('group_call_start', async (data) => {
      try {
        const { groupId, callType } = data; // callType: 'voice' | 'video'
        const userId = socket.userId;

        // Verify user is group member
        const participant = await ChatParticipant.findOne({
          where: { chatId: groupId, userId, isActive: true }
        });

        if (participant) {
          // Notify group members about call
          socket.to(`chat_${groupId}`).emit('group_call_started', {
            groupId,
            callType,
            startedBy: {
              id: userId,
              username: socket.username
            },
            callId: `call_${groupId}_${Date.now()}`
          });
        }

      } catch (error) {
        console.error('Group call start error:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Leave all group rooms
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room.startsWith('chat_')) {
          const groupId = room.replace('chat_', '');
          socket.to(room).emit('user_left_group', {
            groupId,
            userId: socket.userId,
            username: socket.username
          });
        }
      });
    });
  }
}

module.exports = GroupChatEvents;
