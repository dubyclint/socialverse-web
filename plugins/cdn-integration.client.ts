// ============================================================================
// FILE 6: /plugins/cdn-integration.client.ts - COMPLETE FIXED VERSION
// ============================================================================
// ✅ FIXED: CDN plugin enabled
// ✅ FIXED: Proper initialization and error handling
// ✅ FIXED: Better logging
// ✅ ENHANCED: CDN configuration
// ============================================================================

export default defineNuxtPlugin(() => {
  console.log('[CDN Plugin] Initializing CDN integration')
  
  try {
    // ============================================================================
    // GET RUNTIME CONFIG
    // ============================================================================
    const config = useRuntimeConfig()
    
    console.log('[CDN Plugin] Runtime config loaded')
    console.log('[CDN Plugin] CDN Enabled:', config.public.cdnEnabled)
    console.log('[CDN Plugin] CDN URL:', config.public.cdnUrl)

    // ============================================================================
    // INITIALIZE CDN CONFIGURATION
    // ============================================================================
    const cdnConfig = {
      enabled: config.public.cdnEnabled || true,
      baseUrl: config.public.cdnUrl || '/cdn',
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
      
      // Remove leading slash if present
      const cleanPath = path.startsWith('/') ? path.slice(1) : path
      
      // Combine base URL with path
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

      // Build query parameters for image optimization
      const params = new URLSearchParams()
      if (options.width) params.append('w', options.width.toString())
      if (options.height) params.append('h', options.height.toString())
      if (options.quality) params.append('q', options.quality.toString())

      return `${cdnUrl}?${params.toString()}`
    }

    console.log('[CDN Plugin] ✅ CDN utilities created')

    // ============================================================================
    // RETURN PLUGIN EXPORTS
    // ============================================================================
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
    
    // Provide safe fallback
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
