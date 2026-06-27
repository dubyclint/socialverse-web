// FILE: /server/utils/error-handler.ts - GLOBAL ERROR HANDLER
// ============================================================================
// Handles errors during SSR to prevent routing failures
// ============================================================================

export default defineEventHandler(async (event) => {
  try {
    // Your route handler logic
  } catch (error) {
    console.error('[Error Handler]', error)
    
    // Log error for debugging
    if (process.dev) {
      console.error('Full error:', error)
    }

    // Return user-friendly error response
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        message: process.dev ? (error as Error).message : 'An error occurred',
      }
    }))
  }
})
