// server/models/stream-chat.js
const mongoose = require('mongoose')

const streamChatSchema = new mongoose.Schema({
  streamId: {
    type: String,
    required: true,
    ref: 'Stream'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  messageType: {
    type: String,
    enum: ['text', 'pewgift', 'reaction', 'system', 'moderator'],
    default: 'text'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: {
    type: Date
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // For PewGift messages
  pewGiftData: {
    giftId: String,
    giftName: String,
    giftValue: Number,
    giftImage: String,
    quantity: {
      type: Number,
      default: 1
    }
  },
  // For system messages
  systemData: {
    action: String, // 'user_joined', 'user_left', 'stream_started', etc.
    data: mongoose.Schema.Types.Mixed
  },
  userAvatar: {
    type: String
  },
  userBadges: [{
    type: String // 'verified', 'moderator', 'subscriber', etc.
  }]
}, {
  timestamps: true
})

// Indexes
streamChatSchema.index({ streamId: 1, timestamp: -1 })
streamChatSchema.index({ userId: 1, timestamp: -1 })
streamChatSchema.index({ streamId: 1, messageType: 1 })
streamChatSchema.index({ streamId: 1, isPinned: 1 })

module.exports = mongoose.model('StreamChat', streamChatSchema)
