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

    // Socket handlers run outside the request cookie context, so membership is
    // checked explicitly against the service-role client rather than via RLS.
    const admin = createClient(
      config.public.supabase.url,
      process.env.SUPABASE_SERVICE_ROLE_KEY || config.supabase?.serviceKey || '',
      { auth: { persistSession: false } }
    )

    const roomOf = (chatId: string) => `chat:${chatId}`

    const isMember = async (chatId: string, userId: string): Promise<boolean> => {
      const { data } = await admin
        .from('chat_room_members')
        .select('room_id')
        .eq('room_id', chatId)
        .eq('user_id', userId)
        .maybeSingle()
      return Boolean(data)
    }

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

      const joinChat = async (data: any) => {
        const chatId: string | undefined = data?.chatId
        if (!chatId || !socket.userId) return

        if (!(await isMember(chatId, socket.userId))) {
          socket.emit('chat:error', { chatId, message: 'Not a member of this chat' })
          return
        }

        await socket.join(roomOf(chatId))
        socket.emit('chat:joined', { chatId })
      }

      socket.on('join_chat', joinChat)
      socket.on('chat:join', joinChat)

      const leaveChat = (data: any) => {
        if (data?.chatId) void socket.leave(roomOf(data.chatId))
      }

      socket.on('leave_chat', leaveChat)
      socket.on('chat:leave', leaveChat)

      // Messages are persisted here rather than mirrored between clients, so
      // history survives reconnects and only room members receive them.
      const handleMessage = async (data: any) => {
        const chatId: string | undefined = data?.chatId
        const text: string = (data?.message ?? data?.content ?? '').toString().trim()

        if (!chatId || !text || !socket.userId) return
        if (text.length > 2000) {
          socket.emit('chat:error', { chatId, message: 'Message too long' })
          return
        }
        if (!(await isMember(chatId, socket.userId))) {
          socket.emit('chat:error', { chatId, message: 'Not a member of this chat' })
          return
        }

        const { data: inserted, error } = await admin
          .from('chat_messages')
          .insert({ room_id: chatId, sender_id: socket.userId, message_text: text })
          .select('id, created_at')
          .single()

        if (error) {
          socket.emit('chat:error', { chatId, message: 'Failed to send message' })
          return
        }

        await admin.from('chat_rooms').update({ updated_at: new Date().toISOString() }).eq('id', chatId)

        io?.to(roomOf(chatId)).emit('chat:message', {
          id: inserted.id,
          chatId,
          content: text,
          senderId: socket.userId,
          timestamp: inserted.created_at
        })
      }

      socket.on('chat:message', handleMessage)
      socket.on('send_message', handleMessage)

      const handleTyping = (data: any) => {
        if (!data?.chatId) return
        socket.to(roomOf(data.chatId)).emit('chat:typing', { userId: socket.userId, chatId: data.chatId })
      }

      socket.on('chat:typing', handleTyping)
      socket.on('typing', handleTyping)

      socket.on('chat:stop-typing', (data: any) => {
        if (!data?.chatId) return
        socket.to(roomOf(data.chatId)).emit('chat:stop-typing', { userId: socket.userId, chatId: data.chatId })
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
