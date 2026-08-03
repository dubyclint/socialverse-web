// FILE: /server/gateway/socket/plugin.ts
// ============================================================================
// SOCKET.IO SERVER PLUGIN - FIXED: Single Initialization & Nitro Integration
// ============================================================================

import { Server as SocketIOServer } from 'socket.io'
import type { Socket } from 'socket.io'
import { createClient } from '@supabase/supabase-js'
import { Server as Engine } from 'engine.io'
import { defineEventHandler } from 'h3'

interface AuthenticatedSocket extends Socket {
  userId?: string
  email?: string
  authenticated?: boolean
}

let io: SocketIOServer | null = null

export default defineNitroPlugin((nitroApp: any) => {
  console.log('[Socket.IO Plugin] 🚀 Initializing Socket.IO server...')

  if (process.env.NITRO_PRERENDER === 'true') {
    console.log('[Socket.IO Plugin] ⏭️ Skipping during prerender')
    return
  }

  if (io) {
    return
  }

  try {
    // Initialize Engine.io and Socket.IO cleanly once via Nitro
    const engine = new Engine()
    io = new SocketIOServer({
      cors: {
        origin: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingInterval: 25000,
      pingTimeout: 60000
    })

    io.bind(engine)

    // Mount handler on Nitro router to handle requests cleanly on port 8080
    nitroApp.router.use('/socket.io/', defineEventHandler({
      handler(event) {
        engine.handleRequest(event.node.req, event.node.res)
        event._handled = true
      },
      websocket: {
        open(peer) {
          // @ts-expect-error private method bridge for engine.io
          engine.prepare(peer.nodeReq)
          // @ts-expect-error private method bridge for engine.io
          engine.onWebSocket(peer.nodeReq, peer.nodeReq.socket, peer)
        }
      }
    }))

    // ============================================================================
    // AUTHENTICATION MIDDLEWARE
    // ============================================================================
    // The handshake token is a Supabase access token; Supabase itself is the
    // only authority that can validate it (the project signs with rotating keys).
    const config = useRuntimeConfig()
    const supabase = createClient(config.public.supabase.url, config.public.supabase.key)

    io.use(async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
      try {
        const token = socket.handshake?.auth?.token

        if (!token) {
          return next(new Error('Authentication error: No token provided'))
        }

        const { data, error } = await supabase.auth.getUser(token)
        if (error || !data.user) {
          return next(new Error('Authentication error: Invalid token'))
        }

        socket.userId = data.user.id
        socket.email = data.user.email
        socket.authenticated = true

        next()
      } catch (error: any) {
        next(new Error('Authentication error: ' + (error?.message || 'unknown')))
      }
    })

    // ============================================================================
    // CONNECTION HANDLER
    // ============================================================================
    io.on('connection', (socket: AuthenticatedSocket) => {
      console.log('[Socket.IO] ✅ Client connected:', socket.id)

      socket.emit('authenticated', {
        success: true,
        userId: socket.userId,
        socketId: socket.id
      })

      socket.on('chat:message', (data: any) => {
        io?.emit('chat:message', {
          ...data,
          senderId: socket.userId,
          timestamp: new Date().toISOString()
        })
      })

      socket.on('chat:typing', (data: any) => {
        socket.broadcast.emit('chat:typing', { userId: socket.userId, ...data })
      })

      socket.on('chat:stop-typing', () => {
        socket.broadcast.emit('chat:stop-typing', { userId: socket.userId })
      })

      socket.on('presence:online', () => {
        io?.emit('presence:online', { userId: socket.userId, timestamp: new Date().toISOString() })
      })

      socket.on('presence:offline', () => {
        io?.emit('presence:offline', { userId: socket.userId, timestamp: new Date().toISOString() })
      })

      socket.on('notification:send', (data: any) => {
        io?.emit('notification:received', { ...data, senderId: socket.userId, timestamp: new Date().toISOString() })
      })

      socket.on('disconnect', () => {
        io?.emit('presence:offline', { userId: socket.userId, timestamp: new Date().toISOString() })
      })
    })

    console.log('[Socket.IO] ✅ Socket.IO server initialized successfully via Nitro router')
  } catch (error: any) {
    console.error('[Socket.IO] ❌ Failed to initialize Socket.IO:', error?.message)
  }
})
