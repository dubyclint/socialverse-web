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

    /** Sender identity is resolved server-side so clients cannot spoof it. */
    const senderOf = async (userId: string) => {
      const { data } = await admin
        .from('user')
        .select('username, display_name, avatar_url')
        .eq('user_id', userId)
        .maybeSingle()
      return {
        senderName: data?.display_name || data?.username || 'unknown',
        senderAvatar: data?.avatar_url || undefined
      }
    }

    /**
     * Delivery/read state is tracked as a per-member watermark, so marking
     * one message read implicitly covers everything older.
     */
    const markWatermark = async (
      chatId: string,
      userId: string,
      column: 'last_delivered_at' | 'last_read_at',
      at: string
    ) => {
      await admin
        .from('chat_room_members')
        .update({ [column]: at })
        .eq('room_id', chatId)
        .eq('user_id', userId)
    }

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
      const handleMessage = async (data: any, ack?: (result: any) => void) => {
        const chatId: string | undefined = data?.chatId
        const text: string = (data?.message ?? data?.content ?? '').toString().trim()
        const tempId: string | undefined = data?.tempId ? String(data.tempId) : undefined
        const attachments: string[] = Array.isArray(data?.attachments)
          ? data.attachments.filter((url: unknown) => typeof url === 'string').slice(0, 10)
          : []
        const replyToId: string | null = data?.replyToId ? String(data.replyToId) : null
        const messageType: string = typeof data?.messageType === 'string' ? data.messageType : 'text'
        const fail = (message: string) => {
          socket.emit('chat:error', { chatId, tempId, message })
          ack?.({ success: false, tempId, error: message })
        }

        if (!chatId || !socket.userId) return fail('Invalid message')
        if (!text && !attachments.length) return fail('Invalid message')
        if (text.length > 2000) return fail('Message too long')
        if (!(await isMember(chatId, socket.userId))) return fail('Not a member of this chat')

        // Disappearing messages are a room-level setting, so the expiry is
        // stamped on write and enforced when history is read.
        const { data: room } = await admin
          .from('chat_rooms')
          .select('disappearing_seconds')
          .eq('id', chatId)
          .maybeSingle()

        const expiresAt = room?.disappearing_seconds
          ? new Date(Date.now() + room.disappearing_seconds * 1000).toISOString()
          : null

        const { data: inserted, error } = await admin
          .from('chat_messages')
          .insert({
            room_id: chatId,
            sender_id: socket.userId,
            message_text: text || null,
            attachment_urls: attachments,
            message_type: messageType,
            reply_to_id: replyToId,
            expires_at: expiresAt
          })
          .select('id, created_at')
          .single()

        if (error) return fail('Failed to send message')

        await admin.from('chat_rooms').update({ updated_at: new Date().toISOString() }).eq('id', chatId)
        await markWatermark(chatId, socket.userId, 'last_read_at', inserted.created_at)

        const sender = await senderOf(socket.userId)
        const payload = {
          id: inserted.id,
          chatId,
          content: text,
          attachments,
          messageType,
          replyToId,
          expiresAt,
          senderId: socket.userId,
          ...sender,
          timestamp: inserted.created_at,
          tempId
        }

        io?.to(roomOf(chatId)).emit('chat:message', payload)
        ack?.({ success: true, ...payload })
      }

      // Editing and deleting are owner-only; deletes are soft so the other
      // members' history stays consistent.
      socket.on('chat:edit', async (data: any, ack?: (result: any) => void) => {
        const chatId: string | undefined = data?.chatId
        const messageId: string | undefined = data?.messageId
        const content: string = (data?.content ?? '').toString().trim()

        if (!chatId || !messageId || !content || !socket.userId) {
          return ack?.({ success: false, error: 'Invalid edit' })
        }
        if (content.length > 2000) return ack?.({ success: false, error: 'Message too long' })

        const editedAt = new Date().toISOString()
        const { data: updated, error } = await admin
          .from('chat_messages')
          .update({ message_text: content, edited_at: editedAt })
          .eq('id', messageId)
          .eq('room_id', chatId)
          .eq('sender_id', socket.userId)
          .is('deleted_at', null)
          .select('id')
          .maybeSingle()

        if (error || !updated) return ack?.({ success: false, error: 'Could not edit message' })

        io?.to(roomOf(chatId)).emit('chat:edited', { chatId, messageId, content, editedAt })
        ack?.({ success: true })
      })

      socket.on('chat:delete', async (data: any, ack?: (result: any) => void) => {
        const chatId: string | undefined = data?.chatId
        const messageId: string | undefined = data?.messageId
        const forEveryone = data?.forEveryone !== false

        if (!chatId || !messageId || !socket.userId) {
          return ack?.({ success: false, error: 'Invalid delete' })
        }

        const { data: deleted, error } = await admin
          .from('chat_messages')
          .update({
            deleted_at: new Date().toISOString(),
            deleted_for_everyone: forEveryone,
            message_text: null,
            attachment_urls: []
          })
          .eq('id', messageId)
          .eq('room_id', chatId)
          .eq('sender_id', socket.userId)
          .select('id')
          .maybeSingle()

        if (error || !deleted) return ack?.({ success: false, error: 'Could not delete message' })

        io?.to(roomOf(chatId)).emit('chat:deleted', { chatId, messageId, forEveryone })
        ack?.({ success: true })
      })

      // Reactions toggle: sending the same emoji again removes it.
      socket.on('chat:react', async (data: any, ack?: (result: any) => void) => {
        const chatId: string | undefined = data?.chatId
        const messageId: string | undefined = data?.messageId
        const emoji: string = (data?.emoji ?? '').toString().slice(0, 16)

        if (!chatId || !messageId || !emoji || !socket.userId) {
          return ack?.({ success: false, error: 'Invalid reaction' })
        }
        if (!(await isMember(chatId, socket.userId))) {
          return ack?.({ success: false, error: 'Not a member of this chat' })
        }

        const { data: existing } = await admin
          .from('chat_message_reactions')
          .select('id')
          .eq('message_id', messageId)
          .eq('user_id', socket.userId)
          .eq('emoji_code', emoji)
          .maybeSingle()

        if (existing) {
          await admin.from('chat_message_reactions').delete().eq('id', existing.id)
        } else {
          await admin
            .from('chat_message_reactions')
            .insert({ message_id: messageId, user_id: socket.userId, emoji_code: emoji })
        }

        io?.to(roomOf(chatId)).emit('chat:reaction', {
          chatId,
          messageId,
          emoji,
          userId: socket.userId,
          removed: Boolean(existing)
        })
        ack?.({ success: true, removed: Boolean(existing) })
      })

      socket.on('chat:message', handleMessage)
      socket.on('send_message', handleMessage)

      // Receipts: the recipient reports having received (delivered) or opened
      // (read) a chat; the room is told so senders can show ticks.
      const handleReceipt =
        (column: 'last_delivered_at' | 'last_read_at', event: string) => async (data: any) => {
          const chatId: string | undefined = data?.chatId
          if (!chatId || !socket.userId) return
          if (!(await isMember(chatId, socket.userId))) return

          const at = data?.at ? new Date(data.at).toISOString() : new Date().toISOString()
          await markWatermark(chatId, socket.userId, column, at)
          io?.to(roomOf(chatId)).emit(event, { chatId, userId: socket.userId, at })
        }

      socket.on('chat:delivered', handleReceipt('last_delivered_at', 'chat:delivered'))
      socket.on('chat:read', handleReceipt('last_read_at', 'chat:read'))

      // Typing fires per keystroke, so the sender's name is resolved once per
      // connection rather than on every event.
      let typingName: string | undefined
      const typingSenderName = async () => {
        if (!typingName && socket.userId) {
          typingName = (await senderOf(socket.userId)).senderName
        }
        return typingName || 'Someone'
      }

      const handleTyping = async (data: any) => {
        if (!data?.chatId) return
        const isTyping = data?.isTyping !== false
        socket.to(roomOf(data.chatId)).emit(isTyping ? 'chat:typing' : 'chat:stop-typing', {
          userId: socket.userId,
          username: await typingSenderName(),
          chatId: data.chatId
        })
      }

      socket.on('chat:typing', handleTyping)
      socket.on('typing', handleTyping)

      socket.on('chat:stop-typing', async (data: any) => {
        if (!data?.chatId) return
        socket.to(roomOf(data.chatId)).emit('chat:stop-typing', {
          userId: socket.userId,
          username: await typingSenderName(),
          chatId: data.chatId
        })
      })

      // 1:1 calls: SDP/ICE are relayed between the two participants only, and
      // the session row is the source of truth for who may signal on a call.
      if (socket.userId) void socket.join(`user:${socket.userId}`)

      const callParticipants = async (callId: string) => {
        const { data } = await admin
          .from('call_sessions')
          .select('id, room_id, host_id, recipient_id, status')
          .eq('id', callId)
          .maybeSingle()
        return data
      }

      const peerOf = (
        call: { host_id: string; recipient_id: string | null },
        userId: string
      ) => (call.host_id === userId ? call.recipient_id : call.host_id)

      socket.on('call:invite', async (data: any, ack?: (result: any) => void) => {
        const chatId: string | undefined = data?.chatId
        const targetUserId: string | undefined = data?.targetUserId
        const callMode = data?.callType === 'video' ? 'VIDEO' : 'AUDIO'

        if (!socket.userId || !chatId || !targetUserId) {
          return ack?.({ success: false, error: 'Invalid call request' })
        }
        if (!(await isMember(chatId, socket.userId))) {
          return ack?.({ success: false, error: 'Not a member of this chat' })
        }

        const { data: call, error } = await admin
          .from('call_sessions')
          .insert({
            room_id: chatId,
            host_id: socket.userId,
            recipient_id: targetUserId,
            call_mode: callMode,
            status: 'RINGING'
          })
          .select('id, room_id, host_id, recipient_id, call_mode, status')
          .single()

        if (error) return ack?.({ success: false, error: 'Failed to start call' })

        const caller = await senderOf(socket.userId)
        io?.to(`user:${targetUserId}`).emit('call:incoming', {
          ...call,
          callerName: caller.senderName,
          callerAvatar: caller.senderAvatar
        })
        ack?.({ success: true, call })
      })

      const endCall = (status: 'REJECTED' | 'DISCONNECTED' | 'MISSED', event: string) =>
        async (data: any) => {
          const callId: string | undefined = data?.callId
          if (!callId || !socket.userId) return

          const call = await callParticipants(callId)
          if (!call || (call.host_id !== socket.userId && call.recipient_id !== socket.userId)) return

          await admin
            .from('call_sessions')
            .update({ status, ended_at: new Date().toISOString() })
            .eq('id', callId)

          const peer = peerOf(call, socket.userId)
          if (peer) io?.to(`user:${peer}`).emit(event, { callId })
          socket.emit(event, { callId })
        }

      socket.on('call:reject', endCall('REJECTED', 'call:rejected'))
      socket.on('call:end', endCall('DISCONNECTED', 'call:ended'))

      socket.on('call:accept', async (data: any) => {
        const callId: string | undefined = data?.callId
        if (!callId || !socket.userId) return

        const call = await callParticipants(callId)
        if (!call || call.recipient_id !== socket.userId) return

        await admin
          .from('call_sessions')
          .update({ status: 'CONNECTED', started_at: new Date().toISOString() })
          .eq('id', callId)

        io?.to(`user:${call.host_id}`).emit('call:accepted', { callId })
        socket.emit('call:accepted', { callId })
      })

      socket.on('call:signal', async (data: any) => {
        const callId: string | undefined = data?.callId
        if (!callId || !socket.userId || !data?.payload) return

        const call = await callParticipants(callId)
        if (!call || (call.host_id !== socket.userId && call.recipient_id !== socket.userId)) return

        const peer = peerOf(call, socket.userId)
        if (!peer) return

        io?.to(`user:${peer}`).emit('call:signal', {
          callId,
          senderId: socket.userId,
          payloadType: data.payloadType,
          payload: data.payload
        })
      })

      // Universe is a single global room; membership is open to any
      // authenticated user, so only the message itself is validated.
      const universeRoom = 'universe'

      const emitUniverseCount = () => {
        const count = io?.sockets.adapter.rooms.get(universeRoom)?.size ?? 0
        io?.to(universeRoom).emit('universe:online-count', { count })
      }

      socket.on('universe:join', async () => {
        await socket.join(universeRoom)
        emitUniverseCount()
      })

      socket.on('universe:leave', async () => {
        await socket.leave(universeRoom)
        emitUniverseCount()
      })

      socket.on('universe:send-message', async (data: any, ack?: (result: any) => void) => {
        const content: string = (data?.content ?? '').toString().trim()
        const tempId: string | undefined = data?.tempId ? String(data.tempId) : undefined
        const fail = (message: string) => {
          socket.emit('universe:error', { tempId, message })
          ack?.({ success: false, tempId, error: message })
        }

        if (!socket.userId || !content) return fail('Invalid message')
        if (content.length > 2000) return fail('Message too long')

        const { data: inserted, error } = await admin
          .from('universe_messages')
          .insert({
            user_id: socket.userId,
            content,
            country: data?.country || null,
            interest: data?.interest || null,
            language: data?.language || 'en'
          })
          .select('id, content, country, interest, language, created_at')
          .single()

        if (error) return fail('Failed to send message')

        const sender = await senderOf(socket.userId)
        const payload = {
          ...inserted,
          user_id: socket.userId,
          username: sender.senderName,
          avatar: sender.senderAvatar,
          tempId
        }

        io?.to(universeRoom).emit('universe:message', payload)
        ack?.({ success: true, ...payload })
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
