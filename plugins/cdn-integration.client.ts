// ============================================================================
// FILE 1: /plugins/cdn-integration.client.ts - COMPLETE FIXED VERSION
// ============================================================================
// ✅ FIXED: Proper config reading with optional chaining
// ✅ FIXED: Handle undefined/false values correctly
// ✅ FIXED: Better logging for debugging
// ============================================================================

export default defineNuxtPlugin(() => {
  console.log('[CDN Plugin] Initializing CDN integration')
  
  try {
    // ============================================================================
    // GET RUNTIME CONFIG
    // ============================================================================
    const config = useRuntimeConfig()
    
    console.log('[CDN Plugin] Runtime config loaded')
    
    // ✅ FIX: Check if config.public exists and has values
    const cdnUrlFromConfig = config.public?.cdnUrl || ''
    const cdnEnabledFromConfig = config.public?.cdnEnabled !== false
    
    console.log('[CDN Plugin] CDN Enabled (from config):', cdnEnabledFromConfig)
    console.log('[CDN Plugin] CDN URL (from config):', cdnUrlFromConfig || 'not set')

    // ============================================================================
    // INITIALIZE CDN CONFIGURATION
    // ============================================================================
    const cdnConfig = {
      // ✅ FIX: Use config value, default to true if not explicitly false
      enabled: cdnEnabledFromConfig,
      // ✅ FIX: Use config URL or fallback to /cdn
      baseUrl: cdnUrlFromConfig || '/cdn',
      cacheControl: 'public, max-age=31536000',
      imageOptimization: true,
      lazyLoading: true,
      webpSupport: true,
    }
    
    console.log('[CDN Plugin] ✅ CDN Configuration:')
    console.log('[CDN Plugin]   - Enabled:', cdnConfig.enabled)
    console.log('[CDN Plugin]   - Base URL:', cdnConfig.baseUrl)
    console.log('[CDN Plugin]   - Cache Control:', cdnConfig.cacheControl)
    console.log('[CDN Plugin]   - Image Optimization:', cdnConfig.imageOptimization)
    console.log('[CDN Plugin]   - Lazy Loading:', cdnConfig.lazyLoading)
    console.log('[CDN Plugin]   - WebP Support:', cdnConfig.webpSupport)

    // ============================================================================
    // PROVIDE CDN UTILITIES
    // ============================================================================
    const getCdnUrl = (path: string): string => {
      if (!cdnConfig.enabled) {
        return path
      }
      
      const cleanPath = path.startsWith('/') ? path.slice(1) : path
      return `${cdnConfig.baseUrl}/${cleanPath}`
    }

    const getImageUrl = (path: string, options?: { width?: number; height?: number; quality?: number }): string => {
      if (!cdnConfig.enabled || !cdnConfig.imageOptimization) {
        return path
      }

      const cdnUrl = getCdnUrl(path)
      
      if (!options) {
        return cdnUrl
      }

      const params = new URLSearchParams()
      if (options.width) params.append('w', options.width.toString())
      if (options.height) params.append('h', options.height.toString())
      if (options.quality) params.append('q', options.quality.toString())

      return `${cdnUrl}?${params.toString()}`
    }

    console.log('[CDN Plugin] ✅ CDN utilities created')

    return {
      provide: {
        cdn: {
          config: cdnConfig,
          getUrl: getCdnUrl,
          getImageUrl,
        }
      }
    }

  } catch (error) {
    console.error('[CDN Plugin] ❌ Initialization failed:', error)
    
    return {
      provide: {
        cdn: {
          config: { enabled: false },
          getUrl: (path: string) => path,
          getImageUrl: (path: string) => path,
        }
      }
    }
  }
})
