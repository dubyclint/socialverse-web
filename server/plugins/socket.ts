// server/plugins/socket.ts
// SIMPLIFIED VERSION - Lazy initialization only

import type { NitroApp } from 'nitropack'

export default defineNitroPlugin((nitroApp: NitroApp) => {
  console.log('[Socket.IO Plugin] Initializing...')

  if (process.env.NITRO_PRERENDER === 'true') {
    console.log('⏭️ [Socket.IO Plugin] Skipping during prerender')
    return
  }

  // Don't initialize Socket.IO at startup
  // It will be initialized on-demand when first WebSocket connection is made
  
  console.log('✅ [Socket.IO Plugin] Ready (lazy initialization)')
})

