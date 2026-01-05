// FILE: /server/plugins/error-handler.ts - IMPROVED VERSION
// ============================================================================
// Global error handler for Nitro server - CATCHES ALL ERRORS PROPERLY
// ============================================================================

export default defineNitroPlugin((nitroApp) => {
  console.log('[Error Handler Plugin] Initializing...')

  // ============================================================================
  // HOOK 1: Catch errors during request processing
  // ============================================================================
  nitroApp.hooks.hook('error', (error, context) => {
    const event = context?.event
    const req = event?.node?.req
    
    console.error('[Nitro Error Hook] ============ ERROR CAUGHT ============')
    console.error('[Nitro Error Hook] Error Type:', error?.constructor?.name)
    console.error('[Nitro Error Hook] Message:', error?.message)
    console.error('[Nitro Error Hook] Status Code:', error?.statusCode)
    console.error('[Nitro Error Hook] Status Message:', error?.statusMessage)
    console.error('[Nitro Error Hook] URL:', req?.url)
    console.error('[Nitro Error Hook] Method:', req?.method)
    console.error('[Nitro Error Hook] Stack:', error?.stack)
    console.error('[Nitro Error Hook] Data:', error?.data)
    console.error('[Nitro Error Hook] ============ END ERROR ============')
  })

  // ============================================================================
  // HOOK 2: Catch unhandled errors
  // ============================================================================
  nitroApp.hooks.hook('request', (event) => {
    // Wrap the handler to catch any errors
    const originalHandler = event.node.res.end
    
    event.node.res.end = function(...args: any[]) {
      try {
        return originalHandler.apply(this, args)
      } catch (error: any) {
        console.error('[Nitro Unhandled Error] ============ UNHANDLED ERROR ============')
        console.error('[Nitro Unhandled Error] Error Type:', error?.constructor?.name)
        console.error('[Nitro Unhandled Error] Message:', error?.message)
        console.error('[Nitro Unhandled Error] Stack:', error?.stack)
        console.error('[Nitro Unhandled Error] ============ END ERROR ============')
        throw error
      }
    }
  })

  // ============================================================================
  // HOOK 3: Catch errors after response
  // ============================================================================
  nitroApp.hooks.hook('afterResponse', (event, { body }) => {
    // Check if response contains error
    if (event.node.res.statusCode >= 400) {
      console.warn('[Nitro Response] Status:', event.node.res.statusCode)
      console.warn('[Nitro Response] URL:', event.node.req.url)
      console.warn('[Nitro Response] Method:', event.node.req.method)
      if (body) {
        console.warn('[Nitro Response] Body:', typeof body === 'string' ? body : JSON.stringify(body))
      }
    }
  })

  console.log('[Error Handler Plugin] ✅ Ready')
})
