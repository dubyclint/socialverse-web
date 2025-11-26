// server/middleware/compression.ts - GZIP COMPRESSION
import compression from 'compression'

export default defineEventHandler((event) => {
  // Apply compression middleware
  compression({
    level: 6,
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
      // Don't compress if request has no-transform header
      if (req.headers['cache-control']?.includes('no-transform')) {
        return false
      }
      // Use compression filter function
      return compression.filter(req, res)
    }
  })(event.node.req, event.node.res, () => {})
})
