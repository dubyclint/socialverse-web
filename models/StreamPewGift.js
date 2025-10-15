// models/StreamPewGift.js
const mongoose = require('mongoose')

const streamPewGiftSchema = new mongoose.Schema({
  streamId: {
    type: String,
    required: true,
    ref: 'Stream'
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  giftId: {
    type: String,
    required: true
  },
  giftName: {
    type: String,
    required: true
  },
  giftImage: {
    type: String,
    required: true
  },
  giftValue: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  totalValue: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  message: {
    type: String,
    maxlength: 200
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  // Animation and display settings
  animationType: {
    type: String,
    enum: ['normal', 'combo', 'special'],
    default: 'normal'
  },
  comboCount: {
    type: Number,
    default: 1
  },
  displayDuration: {
    type: Number, // in milliseconds
    default: 3000
  },
  // Transaction details
  transactionId: {
    type: String,
    unique: true,
    default: () => `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  // Revenue sharing
  platformFee: {
    type: Number,
    default: 0
  },
  streamerRevenue: {
    type: Number,
    default: 0
  },
  // Metadata
  senderUsername: {
    type: String,
    required: true
  },
  senderAvatar: {
    type: String
  },
  receiverUsername: {
    type: String,
    required: true
  },
  deviceType: {
    type: String,
    enum: ['mobile', 'desktop', 'tablet']
  }
}, {
  timestamps: true
})

// Indexes
streamPewGiftSchema.index({ streamId: 1, timestamp: -1 })
streamPewGiftSchema.index({ senderId: 1, timestamp: -1 })
streamPewGiftSchema.index({ receiverId: 1, timestamp: -1 })
streamPewGiftSchema.index({ transactionId: 1 }, { unique: true })
streamPewGiftSchema.index({ status: 1 })

// Pre-save middleware to calculate total value and revenue
streamPewGiftSchema.pre('save', function(next) {
  this.totalValue = this.giftValue * this.quantity
  this.platformFee = Math.round(this.totalValue * 0.3) // 30% platform fee
  this.streamerRevenue = this.totalValue - this.platformFee
  next()
})

module.exports = mongoose.model('StreamPewGift', streamPewGiftSchema)
