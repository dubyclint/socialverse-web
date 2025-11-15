// ============================================================================
// CREATE: /plugins/cdn-integration.client.ts
// ============================================================================
// CDN Integration Plugin for serving static assets from CDN

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const cdnUrl = config.public.cdnUrl
  const cdnEnabled = config.public.cdnEnabled

  if (!cdnEnabled || !cdnUrl) {
    console.log('[CDN Plugin] CDN is disabled or not configured')
    return
  }

  console.log('[CDN Plugin] CDN enabled:', cdnUrl)

  // ============================================================================
  // REWRITE ASSET URLS TO USE CDN
  // ============================================================================
  
  // Intercept image loading
  const rewriteImageUrl = (url: string): string => {
    if (!url) return url
    
    // Skip absolute URLs and data URLs
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url
    }
    
    // Skip if already using CDN
    if (url.includes(cdnUrl)) {
      return url
    }
    
    // Rewrite relative URLs to CDN
    const cleanUrl = url.startsWith('/') ? url : `/${url}`
    return `${cdnUrl}${cleanUrl}`
  }

  // ============================================================================
  // PROVIDE CDN UTILITIES
  // ============================================================================
  
  return {
    provide: {
      cdn: {
        url: cdnUrl,
        enabled: cdnEnabled,
        rewriteImageUrl,
        
        // Get CDN URL for a given path
        getUrl: (path: string): string => {
          if (!cdnEnabled || !cdnUrl) return path
          return rewriteImageUrl(path)
        },
        
        // Get CDN URL for static assets
        getAssetUrl: (path: string): string => {
          if (!cdnEnabled || !cdnUrl) return path
          const cleanPath = path.startsWith('/') ? path : `/${path}`
          return `${cdnUrl}${cleanPath}`
        },
      }
    }
  }
})
