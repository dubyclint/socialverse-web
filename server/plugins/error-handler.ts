// FILE: /server/plugins/error-handler.ts - COMPLETE FIXED VERSION
// ============================================================================
// Global error handler for Nitro server
// ============================================================================

export default defineNitroPlugin((nitroApp) => {
  console.log('[Error Handler Plugin] Initializing...')

  // Handle errors globally
  nitroApp.hooks.hook('error', (error, context) => {
    console.error('[Nitro Error]', {
      message: error.message,
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      url: context?.event?.node?.req?.url,
      method: context?.event?.node?.req?.method,
    })
  })

  console.log('[Error Handler Plugin] ✅ Ready')
})


