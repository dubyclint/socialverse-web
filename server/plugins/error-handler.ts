// server/plugins/error-handler.ts
// FIXED: No type imports, simplified hooks

export default defineNitroPlugin((nitroApp) => {
  console.log('[Error Handler Plugin] Initializing global error handler')
  
  try {
    nitroApp.hooks.hook('error', (error, context) => {
      console.error('[Global Error Handler] Error caught:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        timestamp: new Date().toISOString()
      })
    })

    console.log('[Error Handler Plugin] Successfully initialized')
  } catch (error) {
    console.error('[Error Handler Plugin] Failed to initialize:', error)
  }
})

