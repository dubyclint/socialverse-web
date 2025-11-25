// server/plugins/socket.ts
import type { NitroApp } from 'nitropack'

export default defineNitroPlugin((nitroApp: NitroApp) => {
  console.log('[Socket.IO Plugin] Registered (deferred initialization)')
  
  // Skip during prerender
  if (process.env.NITRO_PRERENDER === 'true') {
    console.log('⏭️ [Socket.IO Plugin] Skipping during prerender')
    return
  }

  // Socket.IO will be initialized lazily when first needed
  // This prevents blocking the server startup
  let io: any = null

  // Provide a getter function for other parts of the app
  if (process.server) {
    globalThis.$getSocketIO = async () => {
      if (!io) {
        try {
          const { Server: SocketIOServer } = await import('socket.io')
          // Socket.IO will attach to the existing HTTP server automatically
          io = new SocketIOServer({
            cors: {
              origin: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
              methods: ['GET', 'POST'],
              credentials: true,
              allowEIO3: true
            },
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000
          })
          console.log('✅ [Socket.IO Plugin] Initialized on first use')
        } catch (error) {
          console.error('[Socket.IO Plugin] Failed to initialize:', error)
        }
      }
      return io
    }
  }
})
