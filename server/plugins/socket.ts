// server/plugins/socket.ts
// FIXED: No type imports, simplified

export default defineNitroPlugin((nitroApp) => {
  console.log('[Socket.IO Plugin] Initializing...')

  if (process.env.NITRO_PRERENDER === 'true') {
    console.log('⏭️ [Socket.IO Plugin] Skipping during prerender')
    return
  }

  console.log('✅ [Socket.IO Plugin] Ready (lazy initialization)')
})
