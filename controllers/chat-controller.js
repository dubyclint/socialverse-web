// controllers/chatController.js
const Chat = require('../models/chat');
const ChatMessage = require('../models/chatMessage');
const ChatParticipant = require('../models/chatParticipant');
const UserContact = require('../models/userContact');
const { Op } = require('sequelize');
const gun = require('../utils/gunInstance');

class ChatController {
  // Get user's chat list
  async getUserChats(req, res) {
    try {
      const userId = req.user.id;
      
      const chats = await Chat.findAll({
        include: [
          {
            model: ChatParticipant,
            where: { userId, isActive: true },
            include: [{
              model: User,
              attributes: ['id', 'username', 'avatar', 'isOnline', 'lastSeen']
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

      // Calculate unread counts
      const chatsWithUnread = await Promise.all(chats.map(async (chat) => {
        const participant = chat.ChatParticipants[0];
        const unreadCount = await ChatMessage.count({
          where: {
            chatId: chat.id,
            createdAt: { [Op.gt]: participant.lastReadAt },
            senderId: { [Op.ne]: userId }
          }
        });

        return {
          ...chat.toJSON(),
          unreadCount,
          lastRead: participant.lastReadAt
        };
      }));

      res.json({ success: true, chats: chatsWithUnread });
    } catch (error) {
      console.error('Get user chats error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Create or get direct chat
  async createDirectChat(req, res) {
    try {
      const { contactUserId } = req.body;
      const userId = req.user.id;

      // Check if chat already exists
      const existingChat = await Chat.findOne({
        where: { type: 'direct' },
        include: [{
          model: ChatParticipant,
          where: {
            userId: { [Op.in]: [userId, contactUserId] },
            isActive: true
          }
        }]
      });

      if (existingChat && existingChat.ChatParticipants.length === 2) {
        return res.json({ success: true, chat: existingChat });
      }

      // Create new direct chat
      const chat = await Chat.create({
        type: 'direct',
        createdBy: userId
      });

      // Add participants
      await ChatParticipant.bulkCreate([
        { chatId: chat.id, userId, role: 'member' },
        { chatId: chat.id, userId: contactUserId, role: 'member' }
      ]);

      // Sync with Gun.js
      const gunChat = gun.get('chats').get(chat.id);
      gunChat.put({
        id: chat.id,
        type: 'direct',
        participants: [userId, contactUserId],
        createdAt: chat.createdAt.toISOString()
      });

      res.json({ success: true, chat });
    } catch (error) {
      console.error('Create direct chat error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Send message
  async sendMessage(req, res) {
    try {
      const { chatId, content, messageType = 'text', mediaUrl, replyToId, quotedMessage } = req.body;
      const senderId = req.user.id;

      // Verify user is participant
      const participant = await ChatParticipant.findOne({
        where: { chatId, userId: senderId, isActive: true }
      });

      if (!participant) {
        return res.status(403).json({ success: false, error: 'Not authorized to send messages in this chat' });
      }

      // Create message
      const message = await ChatMessage.create({
        chatId,
        senderId,
        content,
        messageType,
        mediaUrl,
        replyToId,
        quotedMessage
      });

      // Update chat's last message time
      await Chat.update(
        { lastMessageAt: new Date() },
        { where: { id: chatId } }
      );

      // Sync with Gun.js for real-time
      const gunMessage = gun.get('messages').get(message.id);
      gunMessage.put({
        id: message.id,
        chatId,
        senderId,
        content,
        messageType,
        mediaUrl,
        replyToId,
        quotedMessage,
        createdAt: message.createdAt.toISOString(),
        isEdited: false,
        isDeleted: false
      });

      // Emit to Socket.io for real-time updates
      req.io.to(`chat_${chatId}`).emit('new_message', {
        ...message.toJSON(),
        sender: req.user
      });

      res.json({ success: true, message });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Edit message (35 minutes limit)
  async editMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      const message = await ChatMessage.findOne({
        where: { id: messageId, senderId: userId, isDeleted: false }
      });

      if (!message) {
        return res.status(404).json({ success: false, error: 'Message not found' });
      }

      // Check 35-minute edit window
      const editWindow = 35 * 60 * 1000; // 35 minutes in milliseconds
      const timeSinceCreation = Date.now() - message.createdAt.getTime();

      if (timeSinceCreation > editWindow) {
        return res.status(400).json({ success: false, error: 'Edit window expired (35 minutes)' });
      }

      // Update message
      await message.update({
        content,
        isEdited: true,
        editedAt: new Date()
      });

      // Sync with Gun.js
      const gunMessage = gun.get('messages').get(messageId);
      gunMessage.put({
        content,
        isEdited: true,
        editedAt: new Date().toISOString()
      });

      // Emit to Socket.io
      req.io.to(`chat_${message.chatId}`).emit('message_edited', {
        messageId,
        content,
        editedAt: message.editedAt
      });

      res.json({ success: true, message });
    } catch (error) {
      console.error('Edit message error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Delete message
  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      const message = await ChatMessage.findOne({
        where: { id: messageId, senderId: userId }
      });

      if (!message) {
        return res.status(404).json({ success: false, error: 'Message not found' });
      }

      // Soft delete
      await message.update({
        isDeleted: true,
        deletedAt: new Date(),
        content: null,
        mediaUrl: null
      });

      // Sync with Gun.js
      const gunMessage = gun.get('messages').get(messageId);
      gunMessage.put({
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        content: null,
        mediaUrl: null
      });

      // Emit to Socket.io
      req.io.to(`chat_${message.chatId}`).emit('message_deleted', {
        messageId,
        deletedAt: message.deletedAt
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get chat messages with pagination
  async getChatMessages(req, res) {
    try {
      const { chatId } = req.params;
      const { page = 1, limit = 50, before } = req.query;
      const userId = req.user.id;

      // Verify user is participant
      const participant = await ChatParticipant.findOne({
        where: { chatId, userId, isActive: true }
      });

      if (!participant) {
        return res.status(403).json({ success: false, error: 'Not authorized to view this chat' });
      }

      const whereClause = { chatId, isDeleted: false };
      if (before) {
        whereClause.createdAt = { [Op.lt]: new Date(before) };
      }

      const messages = await ChatMessage.findAll({
        where: whereClause,
        include: [{
          model: User,
          attributes: ['id', 'username', 'avatar']
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      res.json({ success: true, messages: messages.reverse() });
    } catch (error) {
      console.error('Get chat messages error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Mark messages as read
  async markAsRead(req, res) {
    try {
      const { chatId } = req.params;
      const userId = req.user.id;

      await ChatParticipant.update(
        { lastReadAt: new Date() },
        { where: { chatId, userId } }
      );

      // Emit read receipt
      req.io.to(`chat_${chatId}`).emit('messages_read', {
        chatId,
        userId,
        readAt: new Date()
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new ChatController();
