// server/ws/chatEvents.js - ENHANCED WITH GUNDB INTEGRATION
// ===========================================================

const ChatMessage = require('../../models/chatMessage');
const ChatParticipant = require('../../models/chatParticipant');
const Chat = require('../../models/chat');
const Gun = require('gun');
const { supabase } = require('../utils/supabase');
const { Op } = require('sequelize');

class ChatEvents {
  static setupChatEvents(io, socket, gun) {
    // ===== JOIN CHAT ROOM =====
    socket.on('join_chat', async (data) => {
      try {
        const { chatId } = data;
        const userId = socket.userId;

        // Verify user is participant
        const participant = await ChatParticipant.findOne({
          where: { chatId, userId }
        });

        if (!participant) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Join socket room
        socket.join(`chat:${chatId}`);

        // Load messages from GunDB (local cache)
        const gunChat = gun.get(`chats/${chatId}`);
        gunChat.once((data) => {
          if (data && data.messages) {
            socket.emit('messages:loaded', {
              messages: Object.values(data.messages),
              source: 'gundb'
            });
          }
        });

        // Also load from Supabase for history
        const { data: messages, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('timestamp', { ascending: true })
          .limit(50);

        if (!error && messages) {
          socket.emit('messages:history', {
            messages,
            source: 'supabase'
          });

          // Sync Supabase messages to GunDB
          messages.forEach(msg => {
            gunChat.get('messages').get(msg.id).put({
              id: msg.id,
              senderId: msg.sender_id,
              content: msg.content,
              timestamp: msg.timestamp,
              isEdited: msg.is_edited,
              isDeleted: msg.is_deleted
            });
          });
        }

        // Notify others user joined
        io.to(`chat:${chatId}`).emit('user:joined', {
          userId,
          username: socket.username,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // ===== SEND MESSAGE =====
    socket.on('message:send', async (data) => {
      try {
        const { chatId, content, messageType = 'text' } = data;
        const userId = socket.userId;
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Verify user is participant
        const participant = await ChatParticipant.findOne({
          where: { chatId, userId }
        });

        if (!participant) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        const messageData = {
          id: messageId,
          chatId,
          senderId: userId,
          senderName: socket.username,
          content,
          messageType,
          timestamp: new Date().toISOString(),
          isEdited: false,
          isDeleted: false
        };

        // 1. Store in GunDB (immediate, offline-safe)
        const gunChat = gun.get(`chats/${chatId}`);
        gunChat.get('messages').get(messageId).put({
          ...messageData,
          _gundbTimestamp: Gun.state.is(messageData, 'timestamp')
        });

        // 2. Broadcast via Socket.io (real-time to connected users)
        io.to(`chat:${chatId}`).emit('message:new', messageData);

        // 3. Persist to Supabase (async, for history)
        supabase
          .from('chat_messages')
          .insert({
            id: messageId,
            chat_id: chatId,
            sender_id: userId,
            content,
            message_type: messageType,
            timestamp: messageData.timestamp
          })
          .then(() => {
            // Update chat last message
            return supabase
              .from('chats')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', chatId);
          })
          .catch(err => console.error('Supabase persist error:', err));

        // Acknowledge to sender
        socket.emit('message:sent', { messageId });

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ===== EDIT MESSAGE =====
    socket.on('message:edit', async (data) => {
      try {
        const { chatId, messageId, content } = data;
        const userId = socket.userId;

        // Verify ownership
        const message = await ChatMessage.findOne({
          where: { id: messageId, senderId: userId }
        });

        if (!message) {
          socket.emit('error', { message: 'Cannot edit this message' });
          return;
        }

        const editedData = {
          id: messageId,
          chatId,
          content,
          isEdited: true,
          editedAt: new Date().toISOString()
        };

        // 1. Update in GunDB
        gun.get(`chats/${chatId}`).get('messages').get(messageId).put(editedData);

        // 2. Broadcast via Socket.io
        io.to(`chat:${chatId}`).emit('message:updated', editedData);

        // 3. Persist to Supabase
        supabase
          .from('chat_messages')
          .update({
            content,
            is_edited: true
          })
          .eq('id', messageId)
          .catch(err => console.error('Supabase update error:', err));

      } catch (error) {
        console.error('Edit message error:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // ===== DELETE MESSAGE =====
    socket.on('message:delete', async (data) => {
      try {
        const { chatId, messageId } = data;
        const userId = socket.userId;

        // Verify ownership
        const message = await ChatMessage.findOne({
          where: { id: messageId, senderId: userId }
        });

        if (!message) {
          socket.emit('error', { message: 'Cannot delete this message' });
          return;
        }

        // 1. Mark as deleted in GunDB
        gun.get(`chats/${chatId}`).get('messages').get(messageId).put({
          isDeleted: true,
          deletedAt: new Date().toISOString()
        });

        // 2. Broadcast via Socket.io
        io.to(`chat:${chatId}`).emit('message:deleted', { messageId });

        // 3. Soft delete in Supabase
        supabase
          .from('chat_messages')
          .update({ is_deleted: true })
          .eq('id', messageId)
          .catch(err => console.error('Supabase delete error:', err));

      } catch (error) {
        console.error('Delete message error:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // ===== TYPING INDICATOR =====
    socket.on('user:typing', (data) => {
      const { chatId, isTyping } = data;
      io.to(`chat:${chatId}`).emit('user:typing', {
        userId: socket.userId,
        username: socket.username,
        isTyping
      });
    });

    // ===== LEAVE CHAT ROOM =====
    socket.on('leave_chat', (data) => {
      const { chatId } = data;
      socket.leave(`chat:${chatId}`);
      
      io.to(`chat:${chatId}`).emit('user:left', {
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date().toISOString()
      });
    });

    // ===== SYNC OFFLINE MESSAGES =====
    socket.on('sync:offline-messages', async (data) => {
      try {
        const { chatId, lastSyncTime } = data;
        const userId = socket.userId;

        // Get messages from GunDB that were created while offline
        const gunChat = gun.get(`chats/${chatId}`);
        const offlineMessages = [];

        gunChat.get('messages').once((messages) => {
          if (messages) {
            Object.values(messages).forEach(msg => {
              if (msg.timestamp > lastSyncTime) {
                offlineMessages.push(msg);
              }
            });
          }
        });

        // Send offline messages to client
        socket.emit('sync:offline-messages', {
          messages: offlineMessages,
          syncTime: new Date().toISOString()
        });

      } catch (error) {
        console.error('Sync offline messages error:', error);
      }
    });
  }
}

module.exports = ChatEvents;
