// models/StreamGuest.js
const mongoose = require('mongoose')

const streamGuestSchema = new mongoose.Schema({
  streamId: {
    type: String,
    required: true,
    ref: 'Stream'
  },
  guestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'active', 'ended', 'kicked', 'left'],
    default: 'pending'
  },
  role: {
    type: String,
    enum: ['co-host', 'guest', 'moderator', 'featured-guest'],
    default: 'guest'
  },
  permissions: {
    canStream: {
      type: Boolean,
      default: true
    },
    canModerateChat: {
      type: Boolean,
      default: false
    },
    canInviteGuests: {
      type: Boolean,
      default: false
    },
    canManageStream: {
      type: Boolean,
      default: false
    },
    canShareScreen: {
      type: Boolean,
      default: true
    },
    canUseEffects: {
      type: Boolean,
      default: true
    },
    maxStreamTime: {
      type: Number, // in minutes, 0 = unlimited
      default: 0
    }
  },
  streamSettings: {
    maxQuality: {
      type: String,
      enum: ['1080p60', '1080p30', '720p60', '720p30', '480p30', '360p30'],
      default: '720p30'
    },
    allowedDevices: [{
      type: String,
      enum: ['camera', 'microphone', 'screen', 'mobile-camera']
    }],
    priority: {
      type: Number, // Higher number = higher priority in layout
      default: 1
    },
    layoutPosition: {
      type: String,
      enum: ['auto', 'primary', 'secondary', 'grid', 'picture-in-picture'],
      default: 'auto'
    }
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date
  },
  joinedAt: {
    type: Date
  },
  leftAt: {
    type: Date
  },
  totalStreamTime: {
    type: Number, // in seconds
    default: 0
  },
  invitationMessage: {
    type: String,
    maxlength: 500
  },
  rejectionReason: {
    type: String,
    maxlength: 200
  },
  kickReason: {
    type: String,
    maxlength: 200
  },
  streamStats: {
    peakViewers: {
      type: Number,
      default: 0
    },
    totalInteractions: {
      type: Number,
      default: 0
    },
    qualityChanges: {
      type: Number,
      default: 0
    },
    connectionIssues: {
      type: Number,
      default: 0
    }
  },
  metadata: {
    userAgent: String,
    deviceInfo: String,
    connectionType: String,
    bandwidth: Number
  }
}, {
  timestamps: true
})

// Indexes for performance
streamGuestSchema.index({ streamId: 1, status: 1 })
streamGuestSchema.index({ guestId: 1, status: 1 })
streamGuestSchema.index({ invitedBy: 1 })
streamGuestSchema.index({ createdAt: -1 })

// Virtual for active stream time
streamGuestSchema.virtual('activeStreamTime').get(function() {
  if (this.joinedAt && this.status === 'active') {
    return Math.floor((Date.now() - this.joinedAt.getTime()) / 1000)
  }
  return this.totalStreamTime || 0
})

// Methods
streamGuestSchema.methods.canPerformAction = function(action) {
  const permissionMap = {
    'stream': 'canStream',
    'moderate': 'canModerateChat',
    'invite': 'canInviteGuests',
    'manage': 'canManageStream',
    'screen-share': 'canShareScreen',
    'effects': 'canUseEffects'
  }
  
  return this.permissions[permissionMap[action]] || false
}

streamGuestSchema.methods.getRemainingStreamTime = function() {
  if (this.permissions.maxStreamTime === 0) return Infinity
  
  const usedTime = this.activeStreamTime
  const maxTime = this.permissions.maxStreamTime * 60 // Convert to seconds
  
  return Math.max(0, maxTime - usedTime)
}

streamGuestSchema.methods.updateStreamStats = function(stats) {
  this.streamStats = { ...this.streamStats, ...stats }
  return this.save()
}

module.exports = mongoose.model('StreamGuest', streamGuestSchema)

// models/StreamSession.js
const streamSessionSchema = new mongoose.Schema({
  streamId: {
    type: String,
    required: true,
    ref: 'Stream'
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['streamer', 'co-host', 'guest', 'moderator', 'viewer'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    peerId: String,
    mediaState: {
      video: {
        type: Boolean,
        default: false
      },
      audio: {
        type: Boolean,
        default: false
      },
      screen: {
        type: Boolean,
        default: false
      }
    },
    quality: {
      type: String,
      default: '720p30'
    },
    connectionStats: {
      bitrate: Number,
      packetsLost: Number,
      roundTripTime: Number,
      jitter: Number
    }
  }],
  layout: {
    type: {
      type: String,
      enum: ['single', 'split', 'grid', 'picture-in-picture', 'spotlight'],
      default: 'single'
    },
    primaryUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    positions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      position: {
        x: Number,
        y: Number,
        width: Number,
        height: Number
      },
      zIndex: Number
    }]
  },
  settings: {
    maxGuests: {
      type: Number,
      default: 5
    },
    autoAcceptGuests: {
      type: Boolean,
      default: false
    },
    guestPermissions: {
      canInviteOthers: {
        type: Boolean,
        default: false
      },
      canModerateChat: {
        type: Boolean,
        default: false
      },
      maxStreamTime: {
        type: Number,
        default: 0
      }
    },
    qualitySettings: {
      maxGuestQuality: {
        type: String,
        default: '720p30'
      },
      adaptiveBitrate: {
        type: Boolean,
        default: true
      }
    }
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  analytics: {
    peakParticipants: {
      type: Number,
      default: 0
    },
    totalParticipants: {
      type: Number,
      default: 0
    },
    averageSessionTime: {
      type: Number,
      default: 0
    },
    qualityDistribution: {
      type: Map,
      of: Number,
      default: new Map()
    }
  }
}, {
  timestamps: true
})

// Indexes
streamSessionSchema.index({ streamId: 1, isActive: 1 })
streamSessionSchema.index({ sessionId: 1 })
streamSessionSchema.index({ 'participants.userId': 1 })

// Methods
streamSessionSchema.methods.addParticipant = function(userId, role, peerId) {
  const existingParticipant = this.participants.find(p => 
    p.userId.toString() === userId.toString() && p.isActive
  )
  
  if (existingParticipant) {
    return existingParticipant
  }
  
  const participant = {
    userId,
    role,
    peerId,
    joinedAt: new Date(),
    isActive: true,
    mediaState: { video: false, audio: false, screen: false }
  }
  
  this.participants.push(participant)
  this.analytics.totalParticipants += 1
  
  const activeCount = this.participants.filter(p => p.isActive).length
  if (activeCount > this.analytics.peakParticipants) {
    this.analytics.peakParticipants = activeCount
  }
  
  return participant
}

streamSessionSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString() && p.isActive
  )
  
  if (participant) {
    participant.isActive = false
    participant.leftAt = new Date()
    
    // Update average session time
    const sessionTime = (participant.leftAt - participant.joinedAt) / 1000
    const totalSessions = this.participants.filter(p => p.leftAt).length
    this.analytics.averageSessionTime = 
      (this.analytics.averageSessionTime * (totalSessions - 1) + sessionTime) / totalSessions
  }
  
  return participant
}

streamSessionSchema.methods.updateParticipantMedia = function(userId, mediaState) {
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString() && p.isActive
  )
  
  if (participant) {
    participant.mediaState = { ...participant.mediaState, ...mediaState }
  }
  
  return participant
}

streamSessionSchema.methods.getActiveParticipants = function() {
  return this.participants.filter(p => p.isActive)
}

streamSessionSchema.methods.getParticipantsByRole = function(role) {
  return this.participants.filter(p => p.isActive && p.role === role)
}

module.exports = mongoose.model('StreamSession', streamSessionSchema)

// models/GuestInvitation.js
const guestInvitationSchema = new mongoose.Schema({
  streamId: {
    type: String,
    required: true,
    ref: 'Stream'
  },
  inviterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inviteeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitationType: {
    type: String,
    enum: ['direct', 'open-call', 'scheduled'],
    default: 'direct'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired', 'cancelled'],
    default: 'pending'
  },
  role: {
    type: String,
    enum: ['co-host', 'guest', 'moderator', 'featured-guest'],
    default: 'guest'
  },
  message: {
    type: String,
    maxlength: 500
  },
  permissions: {
    canStream: { type: Boolean, default: true },
    canModerateChat: { type: Boolean, default: false },
    canInviteGuests: { type: Boolean, default: false },
    canShareScreen: { type: Boolean, default: true },
    maxStreamTime: { type: Number, default: 0 }
  },
  scheduledFor: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  },
  respondedAt: Date,
  response: {
    message: String,
    conditions: [{
      type: String,
      value: String
    }]
  },
  metadata: {
    invitationSource: {
      type: String,
      enum: ['chat', 'profile', 'search', 'recommendation'],
      default: 'chat'
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    }
  }
}, {
  timestamps: true
})

// Indexes
guestInvitationSchema.index({ streamId: 1, status: 1 })
guestInvitationSchema.index({ inviteeId: 1, status: 1 })
guestInvitationSchema.index({ expiresAt: 1 })

// Auto-expire invitations
guestInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('GuestInvitation', guestInvitationSchema)
