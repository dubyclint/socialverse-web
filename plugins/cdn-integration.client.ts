// ============================================================================
// plugins/cdn-integration.client.ts - CDN INTEGRATION PLUGIN (FIXED)
// ============================================================================
// ✅ FIXED: CDN plugin now properly checks configuration before enabling
// This prevents warnings when CDN is not configured

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const cdnUrl = config.public.cdnUrl
  const cdnEnabled = config.public.cdnEnabled

  // Check if CDN is properly configured
  if (!cdnEnabled || !cdnUrl) {
    console.log('[CDN Plugin] CDN is disabled or not configured')
    
    return {
      provide: {
        cdnUrl: null,
        cdnEnabled: false,
        rewriteImageUrl: (url: string) => url,
        rewriteAssetUrl: (url: string) => url,
      },
    }
  }

  console.log('[CDN Plugin] CDN enabled:', cdnUrl)

  // ============================================================================
  // REWRITE ASSET URLS TO USE CDN
  // ============================================================================
  
  /**
   * Rewrite image URLs to use CDN
   */
  const rewriteImageUrl = (url: string): string => {
    if (!url) return url
    
    // Skip absolute URLs and data URLs
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url
    }
    
    // Skip relative URLs that are already CDN URLs
    if (url.includes(cdnUrl)) {
      return url
    }
    
    // Rewrite relative URLs to use CDN
    const cleanUrl = url.startsWith('/') ? url : `/${url}`
    return `${cdnUrl}${cleanUrl}`
  }

  /**
   * Rewrite asset URLs to use CDN
   */
  const rewriteAssetUrl = (url: string): string => {
    if (!url) return url
    
    // Skip absolute URLs and data URLs
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url
    }
    
    // Skip relative URLs that are already CDN URLs
    if (url.includes(cdnUrl)) {
      return url
    }
    
    // Rewrite relative URLs to use CDN
    const cleanUrl = url.startsWith('/') ? url : `/${url}`
    return `${cdnUrl}${cleanUrl}`
  }

  /**
   * Intercept image loading in the DOM
   */
  if (process.client) {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        rewriteImagesInDOM()
      })
    } else {
      rewriteImagesInDOM()
    }
  }

  function rewriteImagesInDOM() {
    // Rewrite existing images
    const images = document.querySelectorAll('img')
    images.forEach((img) => {
      if (img.src && !img.src.startsWith('http') && !img.src.startsWith('data:')) {
        img.src = rewriteImageUrl(img.src)
      }
    })

    // Observe for new images
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const newImages = mutation.addedNodes
          newImages.forEach((node: any) => {
            if (node.tagName === 'IMG') {
              if (node.src && !node.src.startsWith('http') && !node.src.startsWith('data:')) {
                node.src = rewriteImageUrl(node.src)
              }
            }
          })
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  return {
    provide: {
      cdnUrl,
      cdnEnabled,
      rewriteImageUrl,
      rewriteAssetUrl,
    },
  }
})
