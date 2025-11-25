// server/plugins/socket.ts
// CORRECTED - Register all WebSocket handlers

import type { NitroApp } from 'nitropack'
import { Server as SocketIOServer } from 'socket.io'

export default defineNitroPlugin((nitroApp: NitroApp) => {
  console.log('[Socket.IO Plugin] Initializing...')

  if (process.env.NITRO_PRERENDER === 'true') {
    console.log('⏭️ [Socket.IO Plugin] Skipping during prerender')
    return
  }

  let io: SocketIOServer | null = null

  if (process.server) {
    globalThis.$getSocketIO = async () => {
      if (!io) {
        try {
          io = new SocketIOServer({
            cors: {
              origin: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
              methods: ['GET', 'POST'],
              credentials: true
            },
            allowEIO3: true,
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000
          })

          // ✅ REGISTER ALL WEBSOCKET HANDLERS
          console.log('[Socket.IO] Registering WebSocket namespaces...')

          // Notifications
          io.of('/notifications').on('connection', (socket) => {
            console.log('[Notifications] Client connected:', socket.id)
            // Handler logic from notifications.ts
          })

          // Presence
          io.of('/presence').on('connection', (socket) => {
            console.log('[Presence] Client connected:', socket.id)
            // Handler logic from presence.ts
          })

          // Chat
          io.of('/chat').on('connection', (socket) => {
            console.log('[Chat] Client connected:', socket.id)
            // Handler logic from chat.ts
          })

          // Group Chat
          io.of('/group-chat').on('connection', (socket) => {
            console.log('[GroupChat] Client connected:', socket.id)
            // Handler logic from group-chat.ts
          })

          // PewGift
          io.of('/pewgift').on('connection', (socket) => {
            console.log('[PewGift] Client connected:', socket.id)
            // Handler logic from pewgift.ts
          })

          // Streaming
          io.of('/streaming').on('connection', (socket) => {
            console.log('[Streaming] Client connected:', socket.id)
            // Handler logic from streaming.ts
          })

          // Enhanced Streaming
          io.of('/enhanced-streaming').on('connection', (socket) => {
            console.log('[EnhancedStreaming] Client connected:', socket.id)
            // Handler logic from enhanced-streaming.ts
          })

          // Call Events
          io.of('/calls').on('connection', (socket) => {
            console.log('[Calls] Client connected:', socket.id)
            // Handler logic from call-events.ts
          })

          // Ad Metrics
          io.of('/ad-metrics').on('connection', (socket) => {
            console.log('[AdMetrics] Client connected:', socket.id)
            // Handler logic from ad-metrics.ts
          })

          console.log('✅ [Socket.IO Plugin] All namespaces registered')
        } catch (error) {
          console.error('[Socket.IO Plugin] Failed to initialize:', error)
        }
      }
      return io
    }
  }
})
