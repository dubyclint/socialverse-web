// FILE: /server/plugins/socket.ts
// ============================================================================
// SOCKET.IO SERVER PLUGIN - PRODUCTION READY (FIXED FOR NITRO)
// ============================================================================
// Initializes Socket.IO server with:
// - Proper CORS configuration
// - Authentication middleware
// - Event handlers for all real-time features
// - Connection pooling and management
// - Error handling and logging
// ============================================================================

import { Server as SocketIOServer } from 'socket.io'
import type { Socket } from 'socket.io'
import { getWSSupabaseClient } from '~/server/utils/ws-supabase'

interface AuthenticatedSocket extends Socket {
  userId?: string
  email?: string
  authenticated?: boolean
}

let io: SocketIOServer | null = null

export default defineNitroPlugin((nitroApp) => {
  console.log('[Socket.IO Plugin] 🚀 Initializing Socket.IO server...')

  if (process.env.NITRO_PRERENDER === 'true') {
    console.log('[Socket.IO Plugin] ⏭️ Skipping during prerender')
    return
  }

  try {
    // Get the HTTP server from Nitro's listener
    // In Nitro, the HTTP server is available through the listener property
    const listener = nitroApp.router?.stack?.[0]?.handle || nitroApp.listener

    if (!listener) {
      console.warn('[Socket.IO Plugin] ⚠️ HTTP server not available, Socket.IO will be initialized on first request')
      
      // Initialize Socket.IO lazily on first request
      nitroApp.hooks.hook('request', async (event) => {
        if (io) return
        
        try {
          const server = event.node.res.socket?.server
          if (server && !io) {
            initializeSocketIO(server)
          }
        } catch (err: any) {
          console.warn('[Socket.IO Plugin] ⚠️ Could not initialize Socket.IO on request:', err.message)
        }
      })
      return
    }

    initializeSocketIO(listener)
  } catch (err: any) {
    console.error('[Socket.IO Plugin] ❌ Failed to initialize Socket.IO:', err.message)
  }

  function initializeSocketIO(httpServer: any) {
    if (io) return

    try {
      // Initialize Socket.IO with proper configuration
      io = new SocketIOServer(httpServer, {
        cors: {
          origin: [
            process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3000',
            'http://localhost:3000',
            'http://localhost:8080',
            'https://socialverse-web.zeabur.app'
          ],
          methods: ['GET', 'POST'],
          credentials: true,
          allowEIO3: true
        },
        transports: ['websocket', 'polling'],
        pingInterval: 25000,
        pingTimeout: 60000,
        maxHttpBufferSize: 1e6,
        allowUpgrades: true,
        perMessageDeflate: {
          threshold: 1024
        }
      })

      console.log('[Socket.IO Plugin] ✅ Socket.IO server created')

      // ============================================================================
      // AUTHENTICATION MIDDLEWARE
      // ============================================================================
      io.use(async (socket: AuthenticatedSocket, next) => {
        try {
          console.log('[Socket.IO Auth] Authenticating socket:', socket.id)

          const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]

          if (!token) {
            console.warn('[Socket.IO Auth] ⚠️ No token provided')
            return next(new Error('Authentication error: No token provided'))
          }

          // Verify token with Supabase
          const supabase = await getWSSupabaseClient()
          const { data: { user }, error } = await supabase.auth.getUser(token)

          if (error || !user) {
            console.warn('[Socket.IO Auth] ❌ Invalid token:', error?.message)
            return next(new Error('Authentication error: Invalid token'))
          }

          socket.userId = user.id
          socket.email = user.email
          socket.authenticated = true

          console.log('[Socket.IO Auth] ✅ Socket authenticated:', user.email)
          next()
        } catch (err: any) {
          console.error('[Socket.IO Auth] ❌ Auth error:', err.message)
          next(new Error('Authentication error: ' + err.message))
        }
      })

      // ============================================================================
      // CONNECTION HANDLER
      // ============================================================================
      io.on('connection', (socket: AuthenticatedSocket) => {
        console.log('[Socket.IO] ✅ Client connected:', socket.id)
        console.log('[Socket.IO] User:', socket.email)

        // Join user-specific room
        if (socket.userId) {
          socket.join(`user:${socket.userId}`)
          console.log('[Socket.IO] User joined room:', `user:${socket.userId}`)
        }

        // ============================================================================
        // CHAT EVENTS
        // ============================================================================
        socket.on('chat:join', (data: { chatId: string }) => {
          try {
            console.log('[Socket.IO Chat] User joining chat:', data.chatId)
            socket.join(`chat:${data.chatId}`)
            socket.to(`chat:${data.chatId}`).emit('chat:user-joined', {
              userId: socket.userId,
              email: socket.email,
              timestamp: new Date().toISOString()
            })
          } catch (err: any) {
            console.error('[Socket.IO Chat] Error joining chat:', err.message)
            socket.emit('error', { message: 'Failed to join chat' })
          }
        })

        socket.on('chat:leave', (data: { chatId: string }) => {
          try {
            console.log('[Socket.IO Chat] User leaving chat:', data.chatId)
            socket.leave(`chat:${data.chatId}`)
            socket.to(`chat:${data.chatId}`).emit('chat:user-left', {
              userId: socket.userId,
              email: socket.email,
              timestamp: new Date().toISOString()
            })
          } catch (err: any) {
            console.error('[Socket.IO Chat] Error leaving chat:', err.message)
          }
        })

        socket.on('chat:message', (data: { chatId: string; message: string }) => {
          try {
            console.log('[Socket.IO Chat] Message received in chat:', data.chatId)
            io?.to(`chat:${data.chatId}`).emit('chat:message', {
              userId: socket.userId,
              email: socket.email,
              message: data.message,
              timestamp: new Date().toISOString()
            })
          } catch (err: any) {
            console.error('[Socket.IO Chat] Error sending message:', err.message)
            socket.emit('error', { message: 'Failed to send message' })
          }
        })

        socket.on('chat:typing', (data: { chatId: string }) => {
          try {
            socket.to(`chat:${data.chatId}`).emit('chat:typing', {
              userId: socket.userId,
              email: socket.email
            })
          } catch (err: any) {
            console.error('[Socket.IO Chat] Error sending typing indicator:', err.message)
          }
        })

        // ============================================================================
        // PRESENCE EVENTS
        // ============================================================================
        socket.on('presence:update', (data: { status: string; activity?: string }) => {
          try {
            console.log('[Socket.IO Presence] Status update:', data.status)
            io?.emit('presence:updated', {
              userId: socket.userId,
              email: socket.email,
              status: data.status,
              activity: data.activity,
              timestamp: new Date().toISOString()
            })
          } catch (err: any) {
            console.error('[Socket.IO Presence] Error updating presence:', err.message)
          }
        })

        // ============================================================================
        // NOTIFICATION EVENTS
        // ============================================================================
        socket.on('notification:subscribe', (data: { types: string[] }) => {
          try {
            console.log('[Socket.IO Notifications] Subscribing to types:', data.types)
            data.types.forEach(type => {
              socket.join(`notification:${type}:${socket.userId}`)
            })
          } catch (err: any) {
            console.error('[Socket.IO Notifications] Error subscribing:', err.message)
          }
        })

        socket.on('notification:unsubscribe', (data: { types: string[] }) => {
          try {
            console.log('[Socket.IO Notifications] Unsubscribing from types:', data.types)
            data.types.forEach(type => {
              socket.leave(`notification:${type}:${socket.userId}`)
            })
          } catch (err: any) {
            console.error('[Socket.IO Notifications] Error unsubscribing:', err.message)
          }
        })

        // ============================================================================
        // STREAM EVENTS
        // ============================================================================
        socket.on('stream:start', (data: { streamId: string; title: string }) => {
          try {
            console.log('[Socket.IO Stream] Stream started:', data.streamId)
            socket.join(`stream:${data.streamId}`)
            io?.emit('stream:started', {
              streamId: data.streamId,
              userId: socket.userId,
              email: socket.email,
              title: data.title,
              timestamp: new Date().toISOString()
            })
          } catch (err: any) {
            console.error('[Socket.IO Stream] Error starting stream:', err.message)
            socket.emit('error', { message: 'Failed to start stream' })
          }
        })

        socket.on('stream:end', (data: { streamId: string }) => {
          try {
            console.log('[Socket.IO Stream] Stream ended:', data.streamId)
            io?.to(`stream:${data.streamId}`).emit('stream:ended', {
              streamId: data.streamId,
              userId: socket.userId,
              timestamp: new Date().toISOString()
            })
            socket.leave(`stream:${data.streamId}`)
          } catch (err: any) {
            console.error('[Socket.IO Stream] Error ending stream:', err.message)
          }
        })

        socket.on('stream:join', (data: { streamId: string }) => {
          try {
            console.log('[Socket.IO Stream] User joining stream:', data.streamId)
            socket.join(`stream:${data.streamId}`)
            socket.to(`stream:${data.streamId}`).emit('stream:viewer-joined', {
              userId: socket.userId,
              email: socket.email,
              timestamp: new Date().toISOString()
            })
          } catch (err: any) {
            console.error('[Socket.IO Stream] Error joining stream:', err.message)
          }
        })

        socket.on('stream:leave', (data: { streamId: string }) => {
          try {
            console.log('[Socket.IO Stream] User leaving stream:', data.streamId)
            socket.leave(`stream:${data.streamId}`)
            socket.to(`stream:${data.streamId}`).emit('stream:viewer-left', {
              userId: socket.userId,
              timestamp: new Date().toISOString()
            })
          } catch (err: any) {
            console.error('[Socket.IO Stream] Error leaving stream:', err.message)
          }
        })

        // ============================================================================
        // CALL EVENTS (WebRTC Signaling)
        // ============================================================================
        socket.on('call:initiate', (data: { targetUserId: string; offer: any }) => {
          try {
            console.log('[Socket.IO Call] Call initiated to:', data.targetUserId)
            io?.to(`user:${data.targetUserId}`).emit('call:incoming', {
              fromUserId: socket.userId,
              fromEmail: socket.email,
              offer: data.offer,
              timestamp: new Date().toISOString()
            })
          } catch (err: any) {
            console.error('[Socket.IO Call] Error initiating call:', err.message)
            socket.emit('error', { message: 'Failed to initiate call' })
          }
        })

        socket.on('call:answer', (data: { targetUserId: string; answer: any }) => {
          try {
            console.log('[Socket.IO Call] Call answered')
            io?.to(`user:${data.targetUserId}`).emit('call:answered', {
              fromUserId: socket.userId,
              answer: data.answer,
              timestamp: new Date().toISOString()
            })
          } catch (err: any) {
            console.error('[Socket.IO Call] Error answering call:', err.message)
          }
        })

        socket.on('call:ice-candidate', (data: { targetUserId: string; candidate: any }) => {
          try {
            io?.to(`user:${data.targetUserId}`).emit('call:ice-candidate', {
              fromUserId: socket.userId,
              candidate: data.candidate
            })
          } catch (err: any) {
            console.error('[Socket.IO Call] Error sending ICE candidate:', err.message)
          }
        })

        socket.on('call:end', (data: { targetUserId: string }) => {
          try {
            console.log('[Socket.IO Call] Call ended')
            io?.to(`user:${data.targetUserId}`).emit('call:ended', {
              fromUserId: socket.userId,
              timestamp: new Date().toISOString()
            })
          } catch (err: any) {
            console.error('[Socket.IO Call] Error ending call:', err.message)
          }
        })

        // ============================================================================
        // DISCONNECT HANDLER
        // ============================================================================
        socket.on('disconnect', () => {
          console.log('[Socket.IO] ❌ Client disconnected:', socket.id)
          if (socket.userId) {
            io?.emit('presence:offline', {
              userId: socket.userId,
              timestamp: new Date().toISOString()
            })
          }
        })

        // ============================================================================
        // ERROR HANDLER
        // ============================================================================
        socket.on('error', (error: any) => {
          console.error('[Socket.IO] ❌ Socket error:', error)
        })
      })

      console.log('[Socket.IO Plugin] ✅ Socket.IO server initialized successfully')
    } catch (err: any) {
      console.error('[Socket.IO Plugin] ❌ Failed to initialize Socket.IO:', err.message)
    }

    // Store io instance for use in other parts of the app
    nitroApp.io = io
  }
})
