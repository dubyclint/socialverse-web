// models/userContact.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const UserContact = sequelize.define('UserContact', {
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
  contactUserId: {
    type: DataTypes.UUID,
    allowNull: true, // null if contact not registered
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  contactPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isRegistered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isPal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isFavorite: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  addedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  lastInteraction: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['contactUserId'] },
    { fields: ['contactPhone'] },
    { fields: ['contactEmail'] },
    { fields: ['userId', 'contactUserId'], unique: true }
  ]
});

module.exports = UserContact;
