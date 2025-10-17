// models/userStatus.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const UserStatus = sequelize.define('UserStatus', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
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
  mediaUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mediaType: {
    type: DataTypes.ENUM('text', 'image', 'video', 'audio'),
    defaultValue: 'text'
  },
  mediaMetadata: {
    type: DataTypes.JSON,
    allowNull: true // duration, size, etc.
  },
  backgroundColor: {
    type: DataTypes.STRING,
    defaultValue: '#000000'
  },
  textColor: {
    type: DataTypes.STRING,
    defaultValue: '#ffffff'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false // 30 hours from creation
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['expiresAt'] },
    { fields: ['isActive'] }
  ]
});

module.exports = UserStatus;
