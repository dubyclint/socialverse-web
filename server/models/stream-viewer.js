// server/models/stream-viewer.js
const mongoose = require('mongoose')

const streamViewerSchema = new mongoose.Schema({
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
  joinTime: {
    type: Date,
    default: Date.now
  },
  leaveTime: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalWatchTime: {
    type: Number, // in seconds
    default: 0
  },
  deviceType: {
    type: String,
    enum: ['mobile', 'desktop', 'tablet'],
    default: 'desktop'
  },
  userAgent: {
    type: String
  },
  ipAddress: {
    type: String
  },
  location: {
    country: String,
    city: String
  },
  quality: {
    type: String,
    enum: ['auto', '1080p', '720p', '480p', '360p'],
    default: 'auto'
  },
  interactions: {
    chatMessages: {
      type: Number,
      default: 0
    },
    pewGiftsSent: {
      type: Number,
      default: 0
    },
    reactions: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
})

// Compound indexes
streamViewerSchema.index({ streamId: 1, userId: 1 }, { unique: true })
streamViewerSchema.index({ streamId: 1, isActive: 1 })
streamViewerSchema.index({ userId: 1, createdAt: -1 })

module.exports = mongoose.model('StreamViewer', streamViewerSchema)
