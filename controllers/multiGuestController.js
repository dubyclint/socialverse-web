// controllers/multiGuestController.js
const StreamGuest = require('../models/StreamGuest')
const StreamSession = require('../models/StreamSession')
const GuestInvitation = require('../models/GuestInvitation')
const Stream = require('../models/Stream')
const User = require('../models/User')

// Guest invitation management
exports.inviteGuest = async (req, res) => {
  try {
    const { streamId, inviteeId, role = 'guest', message, permissions, scheduledFor } = req.body
    const inviterId = req.user.id

    // Verify stream ownership or co-host permissions
    const stream = await Stream.findOne({ streamId })
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' })
    }

    // Check if user has permission to invite guests
    const inviterGuest = await StreamGuest.findOne({ 
      streamId, 
      guestId: inviterId, 
      status: 'active' 
    })
    
    const canInvite = stream.userId.toString() === inviterId || 
                     (inviterGuest && inviterGuest.canPerformAction('invite'))

    if (!canInvite) {
      return res.status(403).json({ error: 'Not authorized to invite guests' })
    }

    // Check if invitation already exists
    const existingInvitation = await GuestInvitation.findOne({
      streamId,
      inviteeId,
      status: 'pending'
    })

    if (existingInvitation) {
      return res.status(400).json({ error: 'Invitation already pending' })
    }

    // Check stream session limits
    const session = await StreamSession.findOne({ streamId, isActive: true })
    if (session) {
      const activeGuests = session.getParticipantsByRole('guest').length
      const activeCoHosts = session.getParticipantsByRole('co-host').length
      
      if (activeGuests + activeCoHosts >= session.settings.maxGuests) {
        return res.status(400).json({ error: 'Maximum guest limit reached' })
      }
    }

    // Create invitation
    const invitation = new GuestInvitation({
      streamId,
      inviterId,
      inviteeId,
      role,
      message,
      permissions: permissions || getDefaultPermissions(role),
      scheduledFor,
      metadata: {
        invitationSource: req.body.source || 'chat',
        priority: req.body.priority || 'normal'
      }
    })

    await invitation.save()

    // Populate invitation data
    await invitation.populate([
      { path: 'inviterId', select: 'username avatar' },
      { path: 'inviteeId', select: 'username avatar' }
    ])

    // Send real-time notification
    req.io.to(`user_${inviteeId}`).emit('guest-invitation', {
      invitation: invitation.toObject(),
      stream: {
        streamId: stream.streamId,
        title: stream.title,
        streamerName: stream.streamerName
      }
    })

    res.json({
      success: true,
      invitation: invitation.toObject()
    })

  } catch (error) {
    console.error('Error inviting guest:', error)
    res.status(500).json({ error: 'Failed to send invitation' })
  }
}

// Respond to guest invitation
exports.respondToInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params
    const { response, message, conditions } = req.body // response: 'accept' | 'reject'
    const userId = req.user.id

    const invitation = await GuestInvitation.findById(invitationId)
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' })
    }

    if (invitation.inviteeId.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation already responded to' })
    }

    // Update invitation
    invitation.status = response === 'accept' ? 'accepted' : 'rejected'
    invitation.respondedAt = new Date()
    invitation.response = { message, conditions }

    await invitation.save()

    if (response === 'accept') {
      // Create StreamGuest record
      const streamGuest = new StreamGuest({
        streamId: invitation.streamId,
        guestId: userId,
        invitedBy: invitation.inviterId,
        status: 'accepted',
        role: invitation.role,
        permissions: invitation.permissions,
        acceptedAt: new Date(),
        invitationMessage: invitation.message
      })

      await streamGuest.save()

      // Add to active session if stream is live
      const session = await StreamSession.findOne({ 
        streamId: invitation.streamId, 
        isActive: true 
      })

      if (session) {
        session.addParticipant(userId, invitation.role, null)
        await session.save()
      }

      // Notify stream participants
      req.io.to(`stream_${invitation.streamId}`).emit('guest-accepted', {
        guestId: userId,
        role: invitation.role,
        permissions: invitation.permissions
      })
    }

    // Notify inviter
    req.io.to(`user_${invitation.inviterId}`).emit('invitation-response', {
      invitationId,
      response,
      inviteeId: userId,
      message
    })

    res.json({
      success: true,
      status: invitation.status
    })

  } catch (error) {
    console.error('Error responding to invitation:', error)
    res.status(500).json({ error: 'Failed to respond to invitation' })
  }
}

// Join stream as guest
exports.joinAsGuest = async (req, res) => {
  try {
    const { streamId } = req.params
    const { peerId, mediaCapabilities } = req.body
    const userId = req.user.id

    // Verify guest permission
    const streamGuest = await StreamGuest.findOne({
      streamId,
      guestId: userId,
      status: 'accepted'
    })

    if (!streamGuest) {
      return res.status(403).json({ error: 'Not authorized to join as guest' })
    }

    // Check remaining stream time
    const remainingTime = streamGuest.getRemainingStreamTime()
    if (remainingTime <= 0) {
      return res.status(400).json({ error: 'Stream time limit exceeded' })
    }

    // Update guest status
    streamGuest.status = 'active'
    streamGuest.joinedAt = new Date()
    await streamGuest.save()

    // Add to session
    const session = await StreamSession.findOne({ streamId, isActive: true })
    if (session) {
      const participant = session.addParticipant(userId, streamGuest.role, peerId)
      participant.mediaState = {
        video: mediaCapabilities.video || false,
        audio: mediaCapabilities.audio || false,
        screen: mediaCapabilities.screen || false
      }
      await session.save()
    }

    // Notify other participants
    req.io.to(`stream_${streamId}`).emit('guest-joined', {
      guestId: userId,
      peerId,
      role: streamGuest.role,
      permissions: streamGuest.permissions,
      mediaCapabilities
    })

    res.json({
      success: true,
      guest: streamGuest.toObject(),
      remainingTime
    })

  } catch (error) {
    console.error('Error joining as guest:', error)
    res.status(500).json({ error: 'Failed to join as guest' })
  }
}

// Leave stream as guest
exports.leaveAsGuest = async (req, res) => {
  try {
    const { streamId } = req.params
    const userId = req.user.id

    const streamGuest = await StreamGuest.findOne({
      streamId,
      guestId: userId,
      status: 'active'
    })

    if (!streamGuest) {
      return res.status(404).json({ error: 'Guest session not found' })
    }

    // Update guest status
    streamGuest.status = 'left'
    streamGuest.leftAt = new Date()
    
    // Calculate total stream time
    if (streamGuest.joinedAt) {
      const sessionTime = (Date.now() - streamGuest.joinedAt.getTime()) / 1000
      streamGuest.totalStreamTime += sessionTime
    }

    await streamGuest.save()

    // Remove from session
    const session = await StreamSession.findOne({ streamId, isActive: true })
    if (session) {
      session.removeParticipant(userId)
      await session.save()
    }

    // Notify other participants
    req.io.to(`stream_${streamId}`).emit('guest-left', {
      guestId: userId
    })

    res.json({ success: true })

  } catch (error) {
    console.error('Error leaving as guest:', error)
    res.status(500).json({ error: 'Failed to leave stream' })
  }
}

// Kick guest from stream
exports.kickGuest = async (req, res) => {
  try {
    const { streamId, guestId } = req.params
    const { reason } = req.body
    const userId = req.user.id

    // Verify permission to kick guests
    const stream = await Stream.findOne({ streamId })
    const kickerGuest = await StreamGuest.findOne({ 
      streamId, 
      guestId: userId, 
      status: 'active' 
    })

    const canKick = stream.userId.toString() === userId || 
                   (kickerGuest && kickerGuest.canPerformAction('manage'))

    if (!canKick) {
      return res.status(403).json({ error: 'Not authorized to kick guests' })
    }

    // Update guest status
    const streamGuest = await StreamGuest.findOne({
      streamId,
      guestId,
      status: 'active'
    })

    if (!streamGuest) {
      return res.status(404).json({ error: 'Guest not found' })
    }

    streamGuest.status = 'kicked'
    streamGuest.leftAt = new Date()
    streamGuest.kickReason = reason

    // Calculate total stream time
    if (streamGuest.joinedAt) {
      const sessionTime = (Date.now() - streamGuest.joinedAt.getTime()) / 1000
      streamGuest.totalStreamTime += sessionTime
    }

    await streamGuest.save()

    // Remove from session
    const session = await StreamSession.findOne({ streamId, isActive: true })
    if (session) {
      session.removeParticipant(guestId)
      await session.save()
    }

    // Notify participants
    req.io.to(`stream_${streamId}`).emit('guest-kicked', {
      guestId,
      reason
    })

    // Notify kicked user
    req.io.to(`user_${guestId}`).emit('kicked-from-stream', {
      streamId,
      reason
    })

    res.json({ success: true })

  } catch (error) {
    console.error('Error kicking guest:', error)
    res.status(500).json({ error: 'Failed to kick guest' })
  }
}

// Update guest permissions
exports.updateGuestPermissions = async (req, res) => {
  try {
    const { streamId, guestId } = req.params
    const { permissions } = req.body
    const userId = req.user.id

    // Verify permission to manage guests
    const stream = await Stream.findOne({ streamId })
    const managerGuest = await StreamGuest.findOne({ 
      streamId, 
      guestId: userId, 
      status: 'active' 
    })

    const canManage = stream.userId.toString() === userId || 
                     (managerGuest && managerGuest.canPerformAction('manage'))

    if (!canManage) {
      return res.status(403).json({ error: 'Not authorized to manage guest permissions' })
    }

    // Update permissions
    const streamGuest = await StreamGuest.findOne({
      streamId,
      guestId,
      status: 'active'
    })

    if (!streamGuest) {
      return res.status(404).json({ error: 'Guest not found' })
    }

    streamGuest.permissions = { ...streamGuest.permissions, ...permissions }
    await streamGuest.save()

    // Notify guest of permission changes
    req.io.to(`user_${guestId}`).emit('permissions-updated', {
      streamId,
      permissions: streamGuest.permissions
    })

    // Notify other participants
    req.io.to(`stream_${streamId}`).emit('guest-permissions-updated', {
      guestId,
      permissions: streamGuest.permissions
    })

    res.json({
      success: true,
      permissions: streamGuest.permissions
    })

  } catch (error) {
    console.error('Error updating guest permissions:', error)
    res.status(500).json({ error: 'Failed to update permissions' })
  }
}

// Get stream guests
exports.getStreamGuests = async (req, res) => {
  try {
    const { streamId } = req.params
    const { status = 'active' } = req.query

    const guests = await StreamGuest.find({ streamId, status })
      .populate('guestId', 'username avatar')
      .populate('invitedBy', 'username avatar')
      .sort({ joinedAt: -1 })

    res.json({
      success: true,
      guests: guests.map(guest => ({
        ...guest.toObject(),
        remainingTime: guest.getRemainingStreamTime(),
        activeStreamTime: guest.activeStreamTime
      }))
    })

  } catch (error) {
    console.error('Error getting stream guests:', error)
    res.status(500).json({ error: 'Failed to get guests' })
  }
}

// Get user's guest invitations
exports.getUserInvitations = async (req, res) => {
  try {
    const userId = req.user.id
    const { status = 'pending' } = req.query

    const invitations = await GuestInvitation.find({ inviteeId: userId, status })
      .populate('inviterId', 'username avatar')
      .populate('streamId', 'title thumbnailUrl')
      .sort({ createdAt: -1 })
      .limit(20)

    res.json({
      success: true,
      invitations
    })

  } catch (error) {
    console.error('Error getting user invitations:', error)
    res.status(500).json({ error: 'Failed to get invitations' })
  }
}

// Create or update stream session
exports.createStreamSession = async (req, res) => {
  try {
    const { streamId } = req.params
    const { settings } = req.body
    const userId = req.user.id

    // Verify stream ownership
    const stream = await Stream.findOne({ streamId })
    if (!stream || stream.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Check if session already exists
    let session = await StreamSession.findOne({ streamId, isActive: true })
    
    if (!session) {
      // Create new session
      session = new StreamSession({
        streamId,
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        settings: {
          maxGuests: settings?.maxGuests || 5,
          autoAcceptGuests: settings?.autoAcceptGuests || false,
          guestPermissions: settings?.guestPermissions || {},
          qualitySettings: settings?.qualitySettings || {}
        }
      })

      // Add streamer as participant
      session.addParticipant(userId, 'streamer', null)
    } else {
      // Update existing session settings
      session.settings = { ...session.settings, ...settings }
    }

    await session.save()

    res.json({
      success: true,
      session: session.toObject()
    })

  } catch (error) {
    console.error('Error creating stream session:', error)
    res.status(500).json({ error: 'Failed to create session' })
  }
}

// Update stream layout
exports.updateStreamLayout = async (req, res) => {
  try {
    const { streamId } = req.params
    const { layout } = req.body
    const userId = req.user.id

    const session = await StreamSession.findOne({ streamId, isActive: true })
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Verify permission to update layout
    const participant = session.participants.find(p => 
      p.userId.toString() === userId && p.isActive
    )

    if (!participant || !['streamer', 'co-host'].includes(participant.role)) {
      return res.status(403).json({ error: 'Not authorized to update layout' })
    }

    // Update layout
    session.layout = { ...session.layout, ...layout }
    await session.save()

    // Notify all participants
    req.io.to(`stream_${streamId}`).emit('layout-updated', {
      layout: session.layout
    })

    res.json({
      success: true,
      layout: session.layout
    })

  } catch (error) {
    console.error('Error updating stream layout:', error)
    res.status(500).json({ error: 'Failed to update layout' })
  }
}

// Helper function to get default permissions based on role
function getDefaultPermissions(role) {
  const permissionSets = {
    'guest': {
      canStream: true,
      canModerateChat: false,
      canInviteGuests: false,
      canShareScreen: true,
      maxStreamTime: 30 // 30 minutes
    },
    'co-host': {
      canStream: true,
      canModerateChat: true,
      canInviteGuests: true,
      canShareScreen: true,
      maxStreamTime: 0 // unlimited
    },
    'moderator': {
      canStream: false,
      canModerateChat: true,
      canInviteGuests: false,
      canShareScreen: false,
      maxStreamTime: 0
    },
    'featured-guest': {
      canStream: true,
      canModerateChat: false,
      canInviteGuests: false,
      canShareScreen: true,
      maxStreamTime: 60 // 60 minutes
    }
  }

  return permissionSets[role] || permissionSets['guest']
}

module.exports = exports
