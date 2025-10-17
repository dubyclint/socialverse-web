// server/ws/chatEvents.js
const ChatMessage = require('../../models/chatMessage');
const ChatParticipant = require('../../models/chatParticipant');
const Chat = require('../../models/chat');
const { Op } = require('sequelize');

class ChatEvents {
  static setupChatEvents(io, socket) {
    // Join specific chat room
    socket.on('join_chat', async (data) => {
      try {
        const { chatId } = data;
        const userId = socket.userId;

        // Verify user is participant
        const participant = await ChatParticipant.findOne({
          where: { chatId, userId, isActive: true }
        });

        if (participant) {
          socket.join(`chat_${chatId}`);
          socket.emit('joined_chat', { chatId, success: true });
          
          // Notify other participants
          socket.to(`chat_${chatId}`).emit('user_joined_chat', {
            chatId,
            userId,
            username: socket.username
          });

          // Mark messages as delivered
          await ChatMessage.update(
            { deliveredAt: new Date() },
            {
              where: {
                chatId,
                senderId: { [Op.ne]: userId },
                deliveredAt: null
              }
            }
          );

        } else {
          socket.emit('joined_chat', { 
            chatId, 
            success: false, 
            error: 'Not authorized to join this chat' 
          });
        }

      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('joined_chat', { 
          chatId: data.chatId, 
          success: false, 
          error: 'Failed to join chat' 
        });
      }
    });

    // Leave chat room
    socket.on('leave_chat', (data) => {
      try {
        const { chatId } = data;
        socket.leave(`chat_${chatId}`);
        
        socket.to(`chat_${chatId}`).emit('user_left_chat', {
          chatId,
          userId: socket.userId,
          username: socket.username
        });

      } catch (error) {
        console.error('Leave chat error:', error);
      }
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        if (!socket.checkRateLimit(socket, 'messages')) return;

        const {
          chatId,
          content,
          messageType = 'text',
          mediaUrl,
          replyToId,
          quotedMessage
        } = data;
        const senderId = socket.userId;

        // Verify user can send messages
        const participant = await ChatParticipant.findOne({
          where: { chatId, userId: senderId, isActive: true }
        });

        if (!participant) {
          socket.emit('message_error', { 
            error: 'Not authorized to send messages in this chat' 
          });
          return;
        }

        // Create message
        const message = await ChatMessage.create({
          chatId,
          senderId,
          content,
          messageType,
          mediaUrl,
          replyToId,
          quotedMessage,
          deliveredAt: new Date()
        });

        // Update chat's last message time
        await Chat.update(
          { lastMessageAt: new Date() },
          { where: { id: chatId } }
        );

        // Get sender details
        const messageWithSender = {
          ...message.toJSON(),
          sender: {
            id: socket.userId,
            username: socket.username,
            avatar: socket.userAvatar
          }
        };

        // Emit to all chat participants
        io.to(`chat_${chatId}`).emit('new_message', messageWithSender);

        // Send delivery confirmation to sender
        socket.emit('message_sent', {
          tempId: data.tempId, // Client-side temporary ID
          messageId: message.id,
          timestamp: message.createdAt
        });

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('message_error', { 
          tempId: data.tempId,
          error: error.message 
        });
      }
    });

    // Edit message
    socket.on('edit_message', async (data) => {
      try {
        const { messageId, content } = data;
        const userId = socket.userId;

        const message = await ChatMessage.findOne({
          where: { id: messageId, senderId: userId, isDeleted: false }
        });

        if (!message) {
          socket.emit('edit_message_error', { 
            messageId, 
            error: 'Message not found' 
          });
          return;
        }

        // Check 35-minute edit window
        const editWindow = 35 * 60 * 1000;
        const timeSinceCreation = Date.now() - message.createdAt.getTime();

        if (timeSinceCreation > editWindow) {
          socket.emit('edit_message_error', { 
            messageId, 
            error: 'Edit window expired (35 minutes)' 
          });
          return;
        }

        // Update message
        await message.update({
          content,
          isEdited: true,
          editedAt: new Date()
        });

        // Emit to chat participants
        io.to(`chat_${message.chatId}`).emit('message_edited', {
          messageId,
          content,
          editedAt: message.editedAt,
          editedBy: {
            id: userId,
            username: socket.username
          }
        });

      } catch (error) {
        console.error('Edit message error:', error);
        socket.emit('edit_message_error', { 
          messageId: data.messageId,
          error: error.message 
        });
      }
    });

    // Delete message
    socket.on('delete_message', async (data) => {
      try {
        const { messageId } = data;
        const userId = socket.userId;

        const message = await ChatMessage.findOne({
          where: { id: messageId, senderId: userId }
        });

        if (!message) {
          socket.emit('delete_message_error', { 
            messageId, 
            error: 'Message not found' 
          });
          return;
        }

        // Soft delete
        await message.update({
          isDeleted: true,
          deletedAt: new Date(),
          content: null,
          mediaUrl: null
        });

        // Emit to chat participants
        io.to(`chat_${message.chatId}`).emit('message_deleted', {
          messageId,
          deletedAt: message.deletedAt,
          deletedBy: {
            id: userId,
            username: socket.username
          }
        });

      } catch (error) {
        console.error('Delete message error:', error);
        socket.emit('delete_message_error', { 
          messageId: data.messageId,
          error: error.message 
        });
      }
    });

    // Mark messages as read
    socket.on('mark_messages_read', async (data) => {
      try {
        const { chatId } = data;
        const userId = socket.userId;

        await ChatParticipant.update(
          { lastReadAt: new Date() },
          { where: { chatId, userId } }
        );

        // Update message read status
        await ChatMessage.update(
          { readAt: new Date() },
          {
            where: {
              chatId,
              senderId: { [Op.ne]: userId },
              readAt: null
            }
          }
        );

        // Emit read receipt to other participants
        socket.to(`chat_${chatId}`).emit('messages_read', {
          chatId,
          readBy: {
            id: userId,
            username: socket.username
          },
          readAt: new Date()
        });

      } catch (error) {
        console.error('Mark messages read error:', error);
      }
    });

    // Message reactions
    socket.on('add_reaction', async (data) => {
      try {
        const { messageId, reaction } = data;
        const userId = socket.userId;

        // Get message to find chat
        const message = await ChatMessage.findByPk(messageId);
        if (!message) return;

        // Verify user is in chat
        const participant = await ChatParticipant.findOne({
          where: { chatId: message.chatId, userId, isActive: true }
        });

        if (!participant) return;

        // Add reaction logic here (implement reaction model if needed)
        
        // Emit to chat participants
        io.to(`chat_${message.chatId}`).emit('reaction_added', {
          messageId,
          reaction,
          userId,
          username: socket.username
        });

      } catch (error) {
        console.error('Add reaction error:', error);
      }
    });

    // Voice message events
    socket.on('voice_message_start', (data) => {
      try {
        const { chatId } = data;
        socket.to(`chat_${chatId}`).emit('user_recording_voice', {
          chatId,
          userId: socket.userId,
          username: socket.username,
          isRecording: true
        });
      } catch (error) {
        console.error('Voice message start error:', error);
      }
    });

    socket.on('voice_message_stop', (data) => {
      try {
        const { chatId } = data;
        socket.to(`chat_${chatId}`).emit('user_recording_voice', {
          chatId,
          userId: socket.userId,
          username: socket.username,
          isRecording: false
        });
      } catch (error) {
        console.error('Voice message stop error:', error);
      }
    });
  }
}

module.exports = ChatEvents;
