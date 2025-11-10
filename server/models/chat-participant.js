// server/models/chat-participant.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const ChatParticipant = sequelize.define('ChatParticipant', {
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
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('member', 'admin', 'owner'),
    defaultValue: 'member'
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  lastReadAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isMuted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  mutedUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  customName: {
    type: DataTypes.STRING,
    allowNull: true // custom name for this chat
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['chatId', 'userId'], unique: true },
    { fields: ['userId'] },
    { fields: ['chatId'] }
  ]
});

module.exports = ChatParticipant;
