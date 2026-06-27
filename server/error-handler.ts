// server/error-handler.ts
export default defineEventHandler((event) => {
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
