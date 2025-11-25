// server/plugins/socket.ts
import type { NitroApp } from 'nitropack'
import { Server as SocketIOServer } from 'socket.io'

let io: SocketIOServer | null = null

export default defineNitroPlugin((nitroApp: NitroApp) => {
  console.log('[Socket.IO Plugin] Initializing...')
  
  // Skip during prerender
  if (process.env.NITRO_PRERENDER === 'true') {
    console.log('⏭️ [Socket.IO Plugin] Skipping during prerender')
    return
  }

  try {
    // Use Nitro's native HTTP server
    const server = nitroApp.node?.res?.socket?.server
    
    if (!server) {
      console.warn('[Socket.IO Plugin] HTTP server not available in this context')
      return
    }

    // Initialize Socket.IO with proper CORS
    io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
        allowEIO3: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
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
