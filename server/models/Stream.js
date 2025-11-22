// server/models/Stream.js
const mongoose = require('mongoose')

const streamSchema = new mongoose.Schema({
  streamId: {
    type: String,
    required: true,
    unique: true,
    default: () => `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'paused'],
    default: 'scheduled'
  },
  viewerCount: {
    type: Number,
    default: 0
  },
  peakViewers: {
    type: Number,
    default: 0
  },
  totalViews: {
    type: Number,
    default: 0
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  scheduledTime: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  isRecorded: {
    type: Boolean,
    default: true
  },
  recordingUrl: {
    type: String
  },
  thumbnailUrl: {
    type: String
  },
  privacy: {
    type: String,
    enum: ['public', 'pals-only', 'private'],
    default: 'public'
  },
  categories: [{
    type: String
  }],
  tags: [{
    type: String
  }],
  streamKey: {
    type: String,
    unique: true,
    default: () => `sk_${Math.random().toString(36).substr(2, 32)}`
  },
  rtmpUrl: {
    type: String
  },
  hlsUrl: {
    type: String
  },
  totalPewGifts: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  chatEnabled: {
    type: Boolean,
    default: true
  },
  pewGiftsEnabled: {
    type: Boolean,
    default: true
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  bannedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  language: {
    type: String,
    default: 'en'
  },
  ageRestriction: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Indexes for better performance
streamSchema.index({ userId: 1 })
streamSchema.index({ status: 1 })
streamSchema.index({ createdAt: -1 })
streamSchema.index({ viewerCount: -1 })
streamSchema.index({ categories: 1 })

module.exports = mongoose.model('Stream', streamSchema)
