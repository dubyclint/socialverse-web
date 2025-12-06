// server/error-handler.ts
export default defineEventHandler((event) => {
  // This is a global error handler for Nitro
  // It will catch any unhandled errors during request processing
  
  const error = event.node.req.error
  
  if (error) {
    console.error('[Nitro Error Handler]', {
      message: error.message,
      stack: error.stack,
      url: event.node.req.url,
      method: event.node.req.method,
    })
  }
})
