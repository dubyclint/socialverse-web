// FILE: /server/plugins/error-handler.ts - REAL-TIME ERROR CATCHING
// ============================================================================
// Global error handler - CATCHES AND LOGS ALL ERRORS IN REAL-TIME
// ============================================================================

export default defineNitroPlugin((nitroApp) => {
  console.log('[Error Handler Plugin] Initializing...')

  // ============================================================================
  // HOOK 1: Catch errors BEFORE they're processed
  // ============================================================================
  nitroApp.hooks.hook('error', (error, context) => {
    const event = context?.event
    const req = event?.node?.req
    
    // Log IMMEDIATELY when error occurs
    console.error('\n')
    console.error('═══════════════════════════════════════════════════════════')
    console.error('[ERROR CAUGHT IN REAL-TIME]')
    console.error('═══════════════════════════════════════════════════════════')
    console.error('Timestamp:', new Date().toISOString())
    console.error('URL:', req?.url)
    console.error('Method:', req?.method)
    console.error('Error Type:', error?.constructor?.name)
    console.error('Status Code:', error?.statusCode || 'N/A')
    console.error('Status Message:', error?.statusMessage || 'N/A')
    console.error('Message:', error?.message)
    console.error('Code:', error?.code || 'N/A')
    console.error('Data:', error?.data ? JSON.stringify(error.data, null, 2) : 'N/A')
    console.error('Stack:', error?.stack)
    console.error('═══════════════════════════════════════════════════════════')
    console.error('\n')
  })

  // ============================================================================
  // HOOK 2: Catch errors during request handling
  // ============================================================================
  nitroApp.hooks.hook('request', (event) => {
    const originalJson = event.node.res.json
    
    // Intercept JSON responses to catch error responses
    event.node.res.json = function(data: any) {
      if (data?.statusCode >= 400 || data?.error) {
        console.error('\n')
        console.error('═══════════════════════════════════════════════════════════')
        console.error('[ERROR RESPONSE BEING SENT]')
        console.error('═══════════════════════════════════════════════════════════')
        console.error('URL:', event.node.req.url)
        console.error('Method:', event.node.req.method)
        console.error('Response Data:', JSON.stringify(data, null, 2))
        console.error('═══════════════════════════════════════════════════════════')
        console.error('\n')
      }
      return originalJson.call(this, data)
    }
  })

  // ============================================================================
  // HOOK 3: Catch unhandled promise rejections
  // ============================================================================
  if (typeof process !== 'undefined') {
    process.on('unhandledRejection', (reason: any, promise: any) => {
      console.error('\n')
      console.error('═══════════════════════════════════════════════════════════')
      console.error('[UNHANDLED PROMISE REJECTION]')
      console.error('═══════════════════════════════════════════════════════════')
      console.error('Reason:', reason)
      console.error('Promise:', promise)
      console.error('Stack:', reason?.stack)
      console.error('═══════════════════════════════════════════════════════════')
      console.error('\n')
    })

    process.on('uncaughtException', (error: any) => {
      console.error('\n')
      console.error('═══════════════════════════════════════════════════════════')
      console.error('[UNCAUGHT EXCEPTION]')
      console.error('═══════════════════════════════════════════════════════════')
      console.error('Error:', error)
      console.error('Stack:', error?.stack)
      console.error('═══════════════════════════════════════════════════════════')
      console.error('\n')
    })
  }

  console.log('[Error Handler Plugin] ✅ Ready - All error hooks installed')
})
