// controllers/streamController.js
const Stream = require('../models/Stream')
const StreamViewer = require('../models/StreamViewer')
const StreamChat = require('../models/StreamChat')
const StreamPewGift = require('../models/StreamPewGift')
const User = require('../models/User')

class StreamController {
  // Create a new stream
  async createStream(req, res) {
    try {
      const { title, description, privacy, categories, tags, scheduledTime, isRecorded } = req.body
      const userId = req.user.id

      // Validate required fields
      if (!title || title.trim().length === 0) {
        return res.status(400).json({ error: 'Stream title is required' })
      }

      // Check if user already has an active stream
      const existingStream = await Stream.findOne({
        userId,
        status: { $in: ['live', 'scheduled'] }
      })

      if (existingStream) {
        return res.status(400).json({ 
          error: 'You already have an active or scheduled stream' 
        })
      }

      const stream = new Stream({
        userId,
        title: title.trim(),
        description: description?.trim(),
        privacy: privacy || 'public',
        categories: categories || [],
        tags: tags || [],
        scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
        isRecorded: isRecorded !== false
      })

      await stream.save()

      // Populate user data
      await stream.populate('userId', 'username avatar verified')

      res.status(201).json({
        success: true,
        stream: stream,
        message: 'Stream created successfully'
      })
    } catch (error) {
      console.error('Create stream error:', error)
      res.status(500).json({ error: 'Failed to create stream' })
    }
  }

  // Start a stream
  async startStream(req, res) {
    try {
      const { streamId } = req.params
      const userId = req.user.id

      const stream = await Stream.findOne({ streamId, userId })
      if (!stream) {
        return res.status(404).json({ error: 'Stream not found' })
      }

      if (stream.status === 'live') {
        return res.status(400).json({ error: 'Stream is already live' })
      }

      // Update stream status
      stream.status = 'live'
      stream.startTime = new Date()
      stream.rtmpUrl = `rtmp://stream.socialverse.com/live/${stream.streamKey}`
      stream.hlsUrl = `https://stream.socialverse.com/hls/${stream.streamKey}/index.m3u8`

      await stream.save()

      // Notify followers/pals that stream started
      await this.notifyStreamStart(stream)

      res.json({
        success: true,
        stream: stream,
        message: 'Stream started successfully'
      })
    } catch (error) {
      console.error('Start stream error:', error)
      res.status(500).json({ error: 'Failed to start stream' })
    }
  }

  // End a stream
  async endStream(req, res) {
    try {
      const { streamId } = req.params
      const userId = req.user.id

      const stream = await Stream.findOne({ streamId, userId })
      if (!stream) {
        return res.status(404).json({ error: 'Stream not found' })
      }

      if (stream.status !== 'live') {
        return res.status(400).json({ error: 'Stream is not currently live' })
      }

      // Calculate duration
      const endTime = new Date()
      const duration = Math.floor((endTime - stream.startTime) / 1000)

      // Update stream
      stream.status = 'ended'
      stream.endTime = endTime
      stream.duration = duration

      // Update all active viewers
      await StreamViewer.updateMany(
        { streamId: stream.streamId, isActive: true },
        { 
          isActive: false, 
          leaveTime: endTime,
          $inc: { totalWatchTime: duration }
        }
      )

      await stream.save()

      res.json({
        success: true,
        stream: stream,
        message: 'Stream ended successfully'
      })
    } catch (error) {
      console.error('End stream error:', error)
      res.status(500).json({ error: 'Failed to end stream' })
    }
  }

  // Get active/live streams
  async getActiveStreams(req, res) {
    try {
      const { page = 1, limit = 20, category, search } = req.query
      const skip = (page - 1) * limit

      let query = { status: 'live' }
      
      if (category) {
        query.categories = category
      }
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }

      const streams = await Stream.find(query)
        .populate('userId', 'username avatar verified')
        .sort({ viewerCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))

      const total = await Stream.countDocuments(query)

      res.json({
        success: true,
        streams,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('Get active streams error:', error)
      res.status(500).json({ error: 'Failed to fetch streams' })
    }
  }

  // Get stream details
  async getStreamDetails(req, res) {
    try {
      const { streamId } = req.params

      const stream = await Stream.findOne({ streamId })
        .populate('userId', 'username avatar verified')
        .populate('moderators', 'username avatar')

      if (!stream) {
        return res.status(404).json({ error: 'Stream not found' })
      }

      // Get recent chat messages
      const recentChat = await StreamChat.find({ 
        streamId, 
        isDeleted: false 
      })
        .populate('userId', 'username avatar verified')
        .sort({ timestamp: -1 })
        .limit(50)

      res.json({
        success: true,
        stream,
        recentChat: recentChat.reverse()
      })
    } catch (error) {
      console.error('Get stream details error:', error)
      res.status(500).json({ error: 'Failed to fetch stream details' })
    }
  }

  // Join a stream as viewer
  async joinStream(req, res) {
    try {
      const { streamId } = req.params
      const userId = req.user.id
      const { deviceType, userAgent, quality } = req.body

      const stream = await Stream.findOne({ streamId })
      if (!stream) {
        return res.status(404).json({ error: 'Stream not found' })
      }

      if (stream.status !== 'live') {
        return res.status(400).json({ error: 'Stream is not currently live' })
      }

      // Check if user is banned
      if (stream.bannedUsers.includes(userId)) {
        return res.status(403).json({ error: 'You are banned from this stream' })
      }

      // Create or update viewer record
      const viewer = await StreamViewer.findOneAndUpdate(
        { streamId, userId },
        {
          streamId,
          userId,
          isActive: true,
          joinTime: new Date(),
          deviceType,
          userAgent,
          quality: quality || 'auto',
          ipAddress: req.ip
        },
        { upsert: true, new: true }
      )

      // Update stream viewer count
      const activeViewers = await StreamViewer.countDocuments({ 
        streamId, 
        isActive: true 
      })
      
      stream.viewerCount = activeViewers
      if (activeViewers > stream.peakViewers) {
        stream.peakViewers = activeViewers
      }
      stream.totalViews += 1

      await stream.save()

      res.json({
        success: true,
        message: 'Joined stream successfully',
        viewerCount: activeViewers
      })
    } catch (error) {
      console.error('Join stream error:', error)
      res.status(500).json({ error: 'Failed to join stream' })
    }
  }

  // Leave a stream
  async leaveStream(req, res) {
    try {
      const { streamId } = req.params
      const userId = req.user.id

      const viewer = await StreamViewer.findOne({ streamId, userId, isActive: true })
      if (!viewer) {
        return res.status(404).json({ error: 'Viewer record not found' })
      }

      // Calculate watch time
      const leaveTime = new Date()
      const watchTime = Math.floor((leaveTime - viewer.joinTime) / 1000)

      viewer.isActive = false
      viewer.leaveTime = leaveTime
      viewer.totalWatchTime += watchTime

      await viewer.save()

      // Update stream viewer count
      const activeViewers = await StreamViewer.countDocuments({ 
        streamId, 
        isActive: true 
      })
      
      await Stream.updateOne(
        { streamId },
        { viewerCount: activeViewers }
      )

      res.json({
        success: true,
        message: 'Left stream successfully',
        watchTime
      })
    } catch (error) {
      console.error('Leave stream error:', error)
      res.status(500).json({ error: 'Failed to leave stream' })
    }
  }

  // Send chat message
  async sendStreamChat(req, res) {
    try {
      const { streamId } = req.params
      const { message, messageType = 'text' } = req.body
      const userId = req.user.id

      const stream = await Stream.findOne({ streamId })
      if (!stream) {
        return res.status(404).json({ error: 'Stream not found' })
      }

      if (!stream.chatEnabled) {
        return res.status(403).json({ error: 'Chat is disabled for this stream' })
      }

      // Check if user is banned
      if (stream.bannedUsers.includes(userId)) {
        return res.status(403).json({ error: 'You are banned from this stream' })
      }

      const user = await User.findById(userId)
      
      const chatMessage = new StreamChat({
        streamId,
        userId,
        username: user.username,
        message: message.trim(),
        messageType,
        userAvatar: user.avatar,
        userBadges: this.getUserBadges(user, stream)
      })

      await chatMessage.save()

      // Update viewer interaction count
      await StreamViewer.updateOne(
        { streamId, userId },
        { $inc: { 'interactions.chatMessages': 1 } }
      )

      res.json({
        success: true,
        chatMessage,
        message: 'Message sent successfully'
      })
    } catch (error) {
      console.error('Send chat error:', error)
      res.status(500).json({ error: 'Failed to send message' })
    }
  }

  // Send PewGift during stream
  async sendPewGift(req, res) {
    try {
      const { streamId } = req.params
      const { giftId, quantity = 1, message, isAnonymous = false } = req.body
      const senderId = req.user.id

      const stream = await Stream.findOne({ streamId })
      if (!stream) {
        return res.status(404).json({ error: 'Stream not found' })
      }

      if (!stream.pewGiftsEnabled) {
        return res.status(403).json({ error: 'PewGifts are disabled for this stream' })
      }

      // Get gift details (assuming you have a Gift model)
      const gift = await Gift.findById(giftId)
      if (!gift) {
        return res.status(404).json({ error: 'Gift not found' })
      }

      const sender = await User.findById(senderId)
      const receiver = await User.findById(stream.userId)

      const pewGift = new StreamPewGift({
        streamId,
        senderId,
        receiverId: stream.userId,
        giftId,
        giftName: gift.name,
        giftImage: gift.image,
        giftValue: gift.value,
        quantity,
        message,
        isAnonymous,
        senderUsername: sender.username,
        senderAvatar: sender.avatar,
        receiverUsername: receiver.username
      })

      await pewGift.save()

      // Update stream totals
      stream.totalPewGifts += quantity
      stream.totalRevenue += pewGift.totalValue
      await stream.save()

      // Update viewer interaction count
      await StreamViewer.updateOne(
        { streamId, userId: senderId },
        { $inc: { 'interactions.pewGiftsSent': quantity } }
      )

      res.json({
        success: true,
        pewGift,
        message: 'PewGift sent successfully'
      })
    } catch (error) {
      console.error('Send PewGift error:', error)
      res.status(500).json({ error: 'Failed to send PewGift' })
    }
  }

  // Helper method to get user badges
  getUserBadges(user, stream) {
    const badges = []
    if (user.verified) badges.push('verified')
    if (stream.userId.toString() === user._id.toString()) badges.push('streamer')
    if (stream.moderators.includes(user._id)) badges.push('moderator')
    return badges
  }

  // Helper method to notify followers when stream starts
  async notifyStreamStart(stream) {
    // Implementation depends on your notification system
    // This could integrate with your existing pushEngine.js
    console.log(`Stream started: ${stream.title} by ${stream.userId}`)
  }
}

module.exports = new StreamController()
