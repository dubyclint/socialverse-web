// server/ws/multi-guest-streaming.ts
import { StreamGuest } from '~/models/StreamGuest'
import { StreamSession } from '~/models/StreamSession'
import { GuestInvitation } from '~/models/GuestInvitation'
import { Stream } from '~/models/Stream'

interface MultiGuestUser {
  userId: string
  username: string
  avatar?: string
  streamId: string
  role: 'streamer' | 'co-host' | 'guest' | 'moderator' | 'viewer'
  permissions: {
    canStream: boolean
    canModerateChat: boolean
    canInviteGuests: boolean
    canManageStream: boolean
    canShareScreen: boolean
    canUseEffects: boolean
    maxStreamTime: number
  }
  socketId: string
  peerId: string
  mediaState: {
    video: boolean
    audio: boolean
    screen: boolean
  }
  streamingStartTime?: Date
  lastActivity: Date
  connectionQuality: {
    bitrate: number
    packetsLost: number
    roundTripTime: number
    jitter: number
  }
}

interface StreamLayout {
  type: 'single' | 'split' | 'grid' | 'picture-in-picture' | 'spotlight'
  primaryUserId?: string
  positions: Array<{
    userId: string
    position: { x: number; y: number; width: number; height: number }
    zIndex: number
  }>
}

// Multi-guest streaming state
const multiGuestUsers = new Map<string, MultiGuestUser>() // socketId -> user
const streamSessions = new Map<string, string>() // streamId -> sessionId
const guestTimers = new Map<string, NodeJS.Timeout>() // userId -> timer

export default defineWebSocketHandler({
  async open(peer, socket) {
    console.log('Multi-Guest Streaming WebSocket connection opened')
    socket.send(JSON.stringify({ 
      type: 'multi-guest-connected', 
      message: 'Connected to multi-guest streaming server',
      timestamp: new Date().toISOString()
    }))
  },

  async message(peer, socket, message) {
    try {
      const data = JSON.parse(message)
      const { type, payload } = data

      switch (type) {
        // Session management
        case 'join-multi-guest-stream':
          await handleJoinMultiGuestStream(socket, payload)
          break

        case 'leave-multi-guest-stream':
          await handleLeaveMultiGuestStream(socket, payload)
          break

        // Guest invitation system
        case 'invite-guest':
          await handleInviteGuest(socket, payload)
          break

        case 'respond-to-invitation':
          await handleRespondToInvitation(socket, payload)
          break

        case 'cancel-invitation':
          await handleCancelInvitation(socket, payload)
          break

        // Guest management
        case 'promote-to-co-host':
          await handlePromoteToCoHost(socket, payload)
          break

        case 'demote-from-co-host':
          await handleDemoteFromCoHost(socket, payload)
          break

        case 'kick-guest':
          await handleKickGuest(socket, payload)
          break

        case 'update-guest-permissions':
          await handleUpdateGuestPermissions(socket, payload)
          break

        // Stream layout management
        case 'update-stream-layout':
          await handleUpdateStreamLayout(socket, payload)
          break

        case 'switch-primary-stream':
          await handleSwitchPrimaryStream(socket, payload)
          break

        case 'update-participant-position':
          await handleUpdateParticipantPosition(socket, payload)
          break

        // Media state management
        case 'update-media-state':
          await handleUpdateMediaState(socket, payload)
          break

        case 'request-media-permission':
          await handleRequestMediaPermission(socket, payload)
          break

        case 'grant-media-permission':
          await handleGrantMediaPermission(socket, payload)
          break

        // Quality and performance
        case 'update-connection-stats':
          await handleUpdateConnectionStats(socket, payload)
          break

        case 'request-quality-change':
          await handleRequestQualityChange(socket, payload)
          break

        // Co-streaming features
        case 'start-co-streaming':
          await handleStartCoStreaming(socket, payload)
          break

        case 'end-co-streaming':
          await handleEndCoStreaming(socket, payload)
          break

        case 'sync-stream-state':
          await handleSyncStreamState(socket, payload)
          break

        default:
          console.log('Unknown multi-guest streaming message type:', type)
      }
    } catch (error) {
      console.error('Multi-Guest Streaming WebSocket error:', error)
      socket.send(JSON.stringify({ 
        type: 'multi-guest-error', 
        message: 'Invalid message format',
        timestamp: new Date().toISOString()
      }))
    }
  },

  async close(peer, socket) {
    const user = multiGuestUsers.get(socket.id)
    if (user) {
      await handleLeaveMultiGuestStream(socket, { streamId: user.streamId })
    }
    console.log('Multi-Guest Streaming WebSocket connection closed')
  }
})

// Join multi-guest stream
async function handleJoinMultiGuestStream(socket: any, payload: any) {
  const { 
    streamId, 
    userId, 
    username, 
    avatar, 
    role = 'viewer',
    peerId,
    mediaCapabilities = { video: false, audio: false, screen: false }
  } = payload

  try {
    // Verify stream exists
    const stream = await Stream.findOne({ streamId })
    if (!stream) {
      socket.send(JSON.stringify({ 
        type: 'multi-guest-error', 
        message: 'Stream not found',
        timestamp: new Date().toISOString()
      }))
      return
    }

    // Get or create stream session
    let session = await StreamSession.findOne({ streamId, isActive: true })
    if (!session && role === 'streamer') {
      session = new StreamSession({
        streamId,
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })
      await session.save()
      streamSessions.set(streamId, session.sessionId)
    }

    // Get user permissions
    let permissions = getDefaultPermissions(role)
    if (role === 'guest' || role === 'co-host') {
      const streamGuest = await StreamGuest.findOne({
        streamId,
        guestId: userId,
        status: { $in: ['accepted', 'active'] }
      })
      
      if (streamGuest) {
        permissions = streamGuest.permissions
        role = streamGuest.role
      } else if (role !== 'viewer') {
        socket.send(JSON.stringify({ 
          type: 'multi-guest-error', 
          message: 'Guest permission required',
          timestamp: new Date().toISOString()
        }))
        return
      }
    }

    // Create user record
    const user: MultiGuestUser = {
      userId,
      username,
      avatar,
      streamId,
      role: role as any,
      permissions,
      socketId: socket.id,
      peerId: peerId || `peer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mediaState: mediaCapabilities,
      lastActivity: new Date(),
      connectionQuality: {
        bitrate: 0,
        packetsLost: 0,
        roundTripTime: 0,
        jitter: 0
      }
    }

    multiGuestUsers.set(socket.id, user)

    // Add to session
    if (session) {
      session.addParticipant(userId, role as any, user.peerId)
      await session.save()
    }

    // Start streaming timer for guests with time limits
    if (permissions.maxStreamTime > 0 && (role === 'guest' || role === 'co-host')) {
      startGuestTimer(userId, permissions.maxStreamTime * 60 * 1000) // Convert to milliseconds
    }

    // Join socket room
    socket.join(`multi-guest-${streamId}`)

    // Send success response
    socket.send(JSON.stringify({
      type: 'multi-guest-joined',
      data: {
        sessionId: session?.sessionId,
        peerId: user.peerId,
        role,
        permissions,
        layout: session?.layout || { type: 'single' },
        participants: await getSessionParticipants(streamId)
      },
      timestamp: new Date().toISOString()
    }))

    // Notify other participants
    socket.to(`multi-guest-${streamId}`).emit('participant-joined', {
      userId,
      username,
      avatar,
      role,
      peerId: user.peerId,
      mediaState: user.mediaState,
      permissions
    })

    console.log(`User ${username} joined multi-guest stream ${streamId} as ${role}`)

  } catch (error) {
    console.error('Error in handleJoinMultiGuestStream:', error)
    socket.send(JSON.stringify({ 
      type: 'multi-guest-error', 
      message: 'Failed to join stream',
      timestamp: new Date().toISOString()
    }))
  }
}

// Leave multi-guest stream
async function handleLeaveMultiGuestStream(socket: any, payload: any) {
  const { streamId } = payload
  const user = multiGuestUsers.get(socket.id)

  if (!user || user.streamId !== streamId) return

  try {
    // Update stream time for guests
    if (user.streamingStartTime && user.permissions.maxStreamTime > 0) {
      const streamTime = (Date.now() - user.streamingStartTime.getTime()) / 1000
      
      const streamGuest = await StreamGuest.findOne({
        streamId,
        guestId: user.userId,
        status: 'active'
      })
      
      if (streamGuest) {
        streamGuest.totalStreamTime += streamTime
        streamGuest.status = 'left'
        streamGuest.leftAt = new Date()
        await streamGuest.save()
      }
    }

    // Clear guest timer
    const timer = guestTimers.get(user.userId)
    if (timer) {
      clearTimeout(timer)
      guestTimers.delete(user.userId)
    }

    // Remove from session
    const session = await StreamSession.findOne({ streamId, isActive: true })
    if (session) {
      session.removeParticipant(user.userId)
      await session.save()
    }

    // Leave socket room
    socket.leave(`multi-guest-${streamId}`)

    // Notify other participants
    socket.to(`multi-guest-${streamId}`).emit('participant-left', {
      userId: user.userId,
      role: user.role
    })

    // Clean up user record
    multiGuestUsers.delete(socket.id)

    console.log(`User ${user.username} left multi-guest stream ${streamId}`)

  } catch (error) {
    console.error('Error in handleLeaveMultiGuestStream:', error)
  }
}

// Invite guest to stream
async function handleInviteGuest(socket: any, payload: any) {
  const { streamId, inviteeId, role = 'guest', message, permissions } = payload
  const user = multiGuestUsers.get(socket.id)

  if (!user || !user.permissions.canInviteGuests) {
    socket.send(JSON.stringify({ 
      type: 'multi-guest-error', 
      message: 'Not authorized to invite guests',
      timestamp: new Date().toISOString()
    }))
    return
  }

  try {
    // Check session limits
    const session = await StreamSession.findOne({ streamId, isActive: true })
    if (session) {
      const activeGuests = session.getParticipantsByRole('guest').length
      const activeCoHosts = session.getParticipantsByRole('co-host').length
      
      if (activeGuests + activeCoHosts >= session.settings.maxGuests) {
        socket.send(JSON.stringify({ 
          type: 'multi-guest-error', 
          message: 'Maximum guest limit reached',
          timestamp: new Date().toISOString()
        }))
        return
      }
    }

    // Create invitation
    const invitation = new GuestInvitation({
      streamId,
      inviterId: user.userId,
      inviteeId,
      role,
      message,
      permissions: permissions || getDefaultPermissions(role)
    })

    await invitation.save()

    // Send invitation to target user
    socket.to(`user_${inviteeId}`).emit('guest-invitation-received', {
      invitation: invitation.toObject(),
      stream: {
        streamId,
        title: 'Live Stream', // Would get from stream data
        inviterName: user.username
      }
    })

    socket.send(JSON.stringify({
      type: 'invitation-sent',
      data: { invitationId: invitation._id },
      timestamp: new Date().toISOString()
    }))

  } catch (error) {
    console.error('Error in handleInviteGuest:', error)
    socket.send(JSON.stringify({ 
      type: 'multi-guest-error', 
      message: 'Failed to send invitation',
      timestamp: new Date().toISOString()
    }))
  }
}

// Respond to invitation
async function handleRespondToInvitation(socket: any, payload: any) {
  const { invitationId, response, message } = payload // response: 'accept' | 'reject'
  const user = multiGuestUsers.get(socket.id)

  if (!user) return

  try {
    const invitation = await GuestInvitation.findById(invitationId)
    if (!invitation || invitation.inviteeId.toString() !== user.userId) {
      socket.send(JSON.stringify({ 
        type: 'multi-guest-error', 
        message: 'Invalid invitation',
        timestamp: new Date().toISOString()
      }))
      return
    }

    invitation.status = response === 'accept' ? 'accepted' : 'rejected'
    invitation.respondedAt = new Date()
    invitation.response = { message }
    await invitation.save()

    if (response === 'accept') {
      // Create StreamGuest record
      const streamGuest = new StreamGuest({
        streamId: invitation.streamId,
        guestId: user.userId,
        invitedBy: invitation.inviterId,
        status: 'accepted',
        role: invitation.role,
        permissions: invitation.permissions,
        acceptedAt: new Date()
      })
      await streamGuest.save()
    }

    // Notify inviter
    socket.to(`user_${invitation.inviterId}`).emit('invitation-response', {
      invitationId,
      response,
      inviteeId: user.userId,
      message
    })

    socket.send(JSON.stringify({
      type: 'invitation-responded',
      data: { status: invitation.status },
      timestamp: new Date().toISOString()
    }))

  } catch (error) {
    console.error('Error in handleRespondToInvitation:', error)
  }
}

// Update stream layout
async function handleUpdateStreamLayout(socket: any, payload: any) {
  const { streamId, layout } = payload
  const user = multiGuestUsers.get(socket.id)

  if (!user || !['streamer', 'co-host'].includes(user.role)) {
    socket.send(JSON.stringify({ 
      type: 'multi-guest-error', 
      message: 'Not authorized to update layout',
      timestamp: new Date().toISOString()
    }))
    return
  }

  try {
    const session = await StreamSession.findOne({ streamId, isActive: true })
    if (!session) return

    session.layout = { ...session.layout, ...layout }
    await session.save()

    // Broadcast layout update
    socket.to(`multi-guest-${streamId}`).emit('layout-updated', {
      layout: session.layout
    })

    socket.send(JSON.stringify({
      type: 'layout-updated',
      data: { layout: session.layout },
      timestamp: new Date().toISOString()
    }))

  } catch (error) {
    console.error('Error in handleUpdateStreamLayout:', error)
  }
}

// Update media state
async function handleUpdateMediaState(socket: any, payload: any) {
  const { streamId, mediaType, enabled } = payload
  const user = multiGuestUsers.get(socket.id)

  if (!user || user.streamId !== streamId) return

  try {
    // Check permissions
    if (mediaType === 'screen' && !user.permissions.canShareScreen) {
      socket.send(JSON.stringify({ 
        type: 'multi-guest-error', 
        message: 'Screen sharing not permitted',
        timestamp: new Date().toISOString()
      }))
      return
    }

    // Update media state
    user.mediaState[mediaType as keyof typeof user.mediaState] = enabled
    user.lastActivity = new Date()

    // Start/stop streaming timer
    if (mediaType === 'video' || mediaType === 'audio') {
      if (enabled && !user.streamingStartTime) {
        user.streamingStartTime = new Date()
      } else if (!enabled && user.streamingStartTime && 
                 !user.mediaState.video && !user.mediaState.audio) {
        // Update total stream time when stopping all media
        const streamTime = (Date.now() - user.streamingStartTime.getTime()) / 1000
        const streamGuest = await StreamGuest.findOne({
          streamId,
          guestId: user.userId,
          status: 'active'
        })
        
        if (streamGuest) {
          streamGuest.totalStreamTime += streamTime
          await streamGuest.save()
        }
        
        user.streamingStartTime = undefined
      }
    }

    // Update session
    const session = await StreamSession.findOne({ streamId, isActive: true })
    if (session) {
      session.updateParticipantMedia(user.userId, user.mediaState)
      await session.save()
    }

    // Broadcast media state change
    socket.to(`multi-guest-${streamId}`).emit('participant-media-updated', {
      userId: user.userId,
      mediaType,
      enabled,
      mediaState: user.mediaState
    })

  } catch (error) {
    console.error('Error in handleUpdateMediaState:', error)
  }
}

// Kick guest
async function handleKickGuest(socket: any, payload: any) {
  const { streamId, guestId, reason } = payload
  const user = multiGuestUsers.get(socket.id)

  if (!user || !user.permissions.canManageStream) {
    socket.send(JSON.stringify({ 
      type: 'multi-guest-error', 
      message: 'Not authorized to kick guests',
      timestamp: new Date().toISOString()
    }))
    return
  }

  try {
    // Find guest user
    const guestUser = Array.from(multiGuestUsers.values()).find(u => 
      u.userId === guestId && u.streamId === streamId
    )

    if (guestUser) {
      // Update guest record
      const streamGuest = await StreamGuest.findOne({
        streamId,
        guestId,
        status: 'active'
      })

      if (streamGuest) {
        streamGuest.status = 'kicked'
        streamGuest.leftAt = new Date()
        streamGuest.kickReason = reason
        
        if (guestUser.streamingStartTime) {
          const streamTime = (Date.now() - guestUser.streamingStartTime.getTime()) / 1000
          streamGuest.totalStreamTime += streamTime
        }
        
        await streamGuest.save()
      }

      // Remove from session
      const session = await StreamSession.findOne({ streamId, isActive: true })
      if (session) {
        session.removeParticipant(guestId)
        await session.save()
      }

      // Notify kicked user
      socket.to(`user_${guestId}`).emit('kicked-from-stream', {
        streamId,
        reason,
        kickedBy: user.username
      })

      // Notify other participants
      socket.to(`multi-guest-${streamId}`).emit('participant-kicked', {
        guestId,
        reason,
        kickedBy: user.userId
      })
    }

  } catch (error) {
    console.error('Error in handleKickGuest:', error)
  }
}

// Helper functions
function getDefaultPermissions(role: string) {
  const permissionSets = {
    'streamer': {
      canStream: true,
      canModerateChat: true,
      canInviteGuests: true,
      canManageStream: true,
      canShareScreen: true,
      canUseEffects: true,
      maxStreamTime: 0
    },
    'co-host': {
      canStream: true,
      canModerateChat: true,
      canInviteGuests: true,
      canManageStream: true,
      canShareScreen: true,
      canUseEffects: true,
      maxStreamTime: 0
    },
    'guest': {
      canStream: true,
      canModerateChat: false,
      canInviteGuests: false,
      canManageStream: false,
      canShareScreen: true,
      canUseEffects: true,
      maxStreamTime: 30
    },
    'moderator': {
      canStream: false,
      canModerateChat: true,
      canInviteGuests: false,
      canManageStream: false,
      canShareScreen: false,
      canUseEffects: false,
      maxStreamTime: 0
    },
    'viewer': {
      canStream: false,
      canModerateChat: false,
      canInviteGuests: false,
      canManageStream: false,
      canShareScreen: false,
      canUseEffects: false,
      maxStreamTime: 0
    }
  }

  return permissionSets[role] || permissionSets['viewer']
}

async function getSessionParticipants(streamId: string) {
  const participants = Array.from(multiGuestUsers.values())
    .filter(user => user.streamId === streamId)
    .map(user => ({
      userId: user.userId,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      peerId: user.peerId,
      mediaState: user.mediaState,
      permissions: user.permissions,
      connectionQuality: user.connectionQuality
    }))

  return participants
}

function startGuestTimer(userId: string, timeLimit: number) {
  const timer = setTimeout(() => {
    // Find user and force disconnect
    const user = Array.from(multiGuestUsers.values()).find(u => u.userId === userId)
    if (user) {
      // Send time limit exceeded message
      const socket = getSocketById(user.socketId)
      if (socket) {
        socket.emit('stream-time-exceeded', {
          message: 'Your streaming time limit has been reached'
        })
        
        // Force leave stream
        handleLeaveMultiGuestStream(socket, { streamId: user.streamId })
      }
    }
    
    guestTimers.delete(userId)
  }, timeLimit)

  guestTimers.set(userId, timer)
}

function getSocketById(socketId: string): any | null {
  // Implementation depends on your WebSocket server setup
  return null
}
