// server/middleware/error-handler.ts
// ✅ NEW: Comprehensive error handling middleware

export default defineEventHandler(async (event) => {
  try {
    // Continue to next middleware/handler
    return await event.node.res
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    
    console.error('[Error Handler Middleware]', {
      message: err.message,
      stack: err.stack,
      url: event.node.req.url,
      method: event.node.req.method,
      timestamp: new Date().toISOString(),
    })
    
    // Return error response
    setResponseStatus(event, 500)
    return {
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
      timestamp: new Date().toISOString(),
    }
  }
})
