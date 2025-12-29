export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  
  // HTML files - no cache
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    setHeader(event, 'Cache-Control', 'public, max-age=0, must-revalidate')
    setHeader(event, 'Pragma', 'no-cache')
    setHeader(event, 'Expires', '0')
  }
  
  // JS/CSS files - long cache with versioning
  if (url.pathname.match(/\.(js|css)$/)) {
    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  }
  
  // API routes - no cache
  if (url.pathname.startsWith('/api/')) {
    setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    setHeader(event, 'Pragma', 'no-cache')
    setHeader(event, 'Expires', '0')
  }
  
  // Security headers
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'X-Frame-Options', 'DENY')
  setHeader(event, 'X-XSS-Protection', '1; mode=block')
})
