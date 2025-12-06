// server/middleware/security.ts - SIMPLIFIED
// Manual security headers instead of helmet

export default defineEventHandler((event) => {
  if (process.env.NODE_ENV === 'production') {
    // Set security headers manually
    event.node.res.setHeader('X-Content-Type-Options', 'nosniff')
    event.node.res.setHeader('X-Frame-Options', 'DENY')
    event.node.res.setHeader('X-XSS-Protection', '1; mode=block')
    event.node.res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    event.node.res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
})
