// server/middleware/logging.ts
// ✅ NEW: Request/response logging middleware

export default defineEventHandler((event) => {
  const startTime = Date.now()
  
  // Log incoming request
  console.log(`[${new Date().toISOString()}] ${event.node.req.method} ${event.node.req.url}`)
  
  // Hook into response to log completion
  event.node.res.on('finish', () => {
    const duration = Date.now() - startTime
    const statusCode = event.node.res.statusCode
    
    console.log(`[${new Date().toISOString()}] ${event.node.req.method} ${event.node.req.url} - ${statusCode} (${duration}ms)`)
  })
})
