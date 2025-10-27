// server/plugins/socket.ts
import type { NitroApp } from 'nitropack'
import { Server as SocketIOServer } from 'socket.io'
import http from 'http'

let io: SocketIOServer | null = null

export default defineNitroPlugin((nitroApp: NitroApp) => {
  console.log('[Socket.IO Plugin] Initializing...')
  
  // Skip during prerender
  if (process.env.NITRO_PRERENDER === 'true') {
    console.log('⏭️ [Socket.IO Plugin] Skipping during prerender')
    return
  }

  try {
    // Get the HTTP server from Nitro
    const listener = nitroApp.router.stack[0]?.handle
    
    if (!listener) {
      console.warn('[Socket.IO Plugin] HTTP server not available yet')
      return
    }

    // Initialize Socket.IO with proper CORS
    io = new SocketIOServer(listener, {
      cors: {
        origin: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
        allowEIO3: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      // Allow unauthenticated connections initially
      allowRequest: (req, callback) => {
        callback(null, true)
      }
    })

    console.log('✅ [Socket.IO Plugin] Initialized successfully')

    // Connection handler
    io.on('connection', (socket) => {
      console.log('✅ [Socket.IO] User connected:', socket.id)
      
      socket.on('disconnect', () => {
        console.log('❌ [Socket.IO] User disconnected:', socket.id)
      })

      socket.on('error', (error) => {
        console.error('[Socket.IO] Error:', error)
      })
    })

    // Store io instance globally for other plugins
    if (process.server) {
      globalThis.$io = io
    }

  } catch (error) {
    console.error('[Socket.IO Plugin] Initialization failed:', error)
  }
})

