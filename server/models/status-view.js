// server/models/status-view.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const StatusView = sequelize.define('StatusView', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  statusId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'UserStatuses',
      key: 'id'
    }
  },
  viewerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  viewedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  indexes: [
    { fields: ['statusId', 'viewerId'], unique: true },
    { fields: ['statusId'] },
    { fields: ['viewerId'] }
  ]
});

module.exports = StatusView;
