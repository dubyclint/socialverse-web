// models/chatMessage.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  chatId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Chats',
      key: 'id'
    }
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'video', 'audio', 'file', 'voice_note', 'system'),
    defaultValue: 'text'
  },
  mediaUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mediaMetadata: {
    type: DataTypes.JSON,
    allowNull: true // size, duration, thumbnail, etc.
  },
  replyToId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'ChatMessages',
      key: 'id'
    }
  },
  quotedMessage: {
    type: DataTypes.JSON,
    allowNull: true // stores quoted message content
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  gunId: {
    type: DataTypes.STRING,
    allowNull: true // for Gun.js sync
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['chatId', 'createdAt'] },
    { fields: ['senderId'] },
    { fields: ['replyToId'] },
    { fields: ['gunId'] }
  ]
});

module.exports = ChatMessage;
