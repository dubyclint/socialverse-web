// models/chat.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('direct', 'group'),
    allowNull: false,
    defaultValue: 'direct'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true // null for direct chats
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      allowInvites: true,
      onlyAdminsCanMessage: false,
      disappearingMessages: 'off', // 'off', '24h', '7d', '60d'
      readReceipts: true
    }
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['type'] },
    { fields: ['lastMessageAt'] },
    { fields: ['createdBy'] }
  ]
});

module.exports = Chat;
