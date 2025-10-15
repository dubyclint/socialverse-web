// routes/streamRoutes.js
const express = require('express')
const router = express.Router()
const streamController = require('../controllers/streamController')
const authMiddleware = require('../middleware/auth')
const rateLimitMiddleware = require('../middleware/rateLimit')

// Apply authentication middleware to all routes
router.use(authMiddleware)

// Stream management routes
router.post('/create', 
  rateLimitMiddleware(5, 60), // 5 requests per minute
  streamController.createStream
)

router.put('/:streamId/start', 
  streamController.startStream
)

router.put('/:streamId/end', 
  streamController.endStream
)

router.put('/:streamId/pause', 
  streamController.pauseStream
)

// Stream discovery and viewing
router.get('/active', 
  streamController.getActiveStreams
)

router.get('/scheduled', 
  streamController.getScheduledStreams
)

router.get('/category/:category', 
  streamController.getStreamsByCategory
)

router.get('/:streamId', 
  streamController.getStreamDetails
)

router.get('/user/:userId', 
  streamController.getUserStreams
)

// Viewer actions
router.post('/:streamId/join', 
  streamController.joinStream
)

router.post('/:streamId/leave', 
  streamController.leaveStream
)

router.get('/:streamId/viewers', 
  streamController.getStreamViewers
)

// Chat functionality
router.post('/:streamId/chat', 
  rateLimitMiddleware(30, 60), // 30 messages per minute
  streamController.sendStreamChat
)

router.get('/:streamId/chat', 
  streamController.getStreamChat
)

router.delete('/:streamId/chat/:messageId', 
  streamController.deleteStreamChatMessage
)

router.put('/:streamId/chat/:messageId/pin', 
  streamController.pinStreamChatMessage
)

// PewGift functionality
router.post('/:streamId/pewgift', 
  rateLimitMiddleware(10, 60), // 10 gifts per minute
  streamController.sendPewGift
)

router.get('/:streamId/pewgifts', 
  streamController.getStreamPewGifts
)

// Stream moderation
router.post('/:streamId/moderators', 
  streamController.addModerator
)

router.delete('/:streamId/moderators/:userId', 
  streamController.removeModerator
)

router.post('/:streamId/ban', 
  streamController.banUser
)

router.delete('/:streamId/ban/:userId', 
  streamController.unbanUser
)

// Stream settings
router.put('/:streamId/settings', 
  streamController.updateStreamSettings
)

router.put('/:streamId/privacy', 
  streamController.updateStreamPrivacy
)

// Analytics
router.get('/:streamId/analytics', 
  streamController.getStreamAnalytics
)

router.get('/user/:userId/analytics', 
  streamController.getUserStreamAnalytics
)

module.exports = router
