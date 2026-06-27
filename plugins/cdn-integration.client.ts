// ============================================================================
// FILE: /plugins/cdn-integration.client.ts - CDN INTEGRATION PLUGIN
// ============================================================================
// ✅ FIXED: Added proper plugin structure with dependsOn
// ✅ FIXED: Added error handling and logging
// ✅ FIXED: Added process.client check
// ✅ FIXED: Proper initialization sequence
// ============================================================================

interface CDNConfig {
  enabled: boolean
  url: string
  imageOptimization: boolean
}

interface ImageOptimizationParams {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpg' | 'png'
}

export default defineNuxtPlugin({
  name: 'socialverse-cdn-integration',
  
  // ✅ FIX: Ensure Pinia is loaded before CDN initialization
  dependsOn: ['pinia'],

  setup() {
    if (!process.client) return

    console.log('[CDN Plugin] Initializing CDN integration plugin')

    try {
      // ============================================================================
      // CDN CONFIGURATION
      // ============================================================================
      const cdnUrl = process.env.NUXT_PUBLIC_CDN_URL || ''
      const cdnEnabled = process.env.NUXT_PUBLIC_CDN_ENABLED === 'true'

      const config: CDNConfig = {
        enabled: cdnEnabled && !!cdnUrl,
        url: cdnUrl,
        imageOptimization: true
      }

      if (!config.enabled) {
        console.warn('[CDN Plugin] ⚠️ CDN is disabled or not configured')
      } else {
        console.log('[CDN Plugin] ✅ CDN is enabled:', config.url)
      }

      // ============================================================================
      // GET CDN URL
      // ============================================================================
      const getUrl = (path: string): string => {
        if (!config.enabled) {
          console.warn('[CDN Plugin] ⚠️ CDN is disabled, returning local path')
          return path
        }

        // Remove leading slash if present
        const cleanPath = path.startsWith('/') ? path.slice(1) : path

        // Construct full CDN URL
        const fullUrl = `${config.url}/${cleanPath}`
        console.log('[CDN Plugin] Generated CDN URL:', fullUrl)

        return fullUrl
      }

      // ============================================================================
      // GET OPTIMIZED IMAGE URL
      // ============================================================================
      const getImageUrl = (path: string, params?: ImageOptimizationParams): string => {
        if (!config.enabled || !config.imageOptimization) {
          console.warn('[CDN Plugin] ⚠️ Image optimization is disabled')
          return getUrl(path)
        }

        const {
          width,
          height,
          quality = 80,
          format = 'webp'
        } = params || {}

        // Build query parameters
        const queryParams = new URLSearchParams()

        if (width) queryParams.append('w', width.toString())
        if (height) queryParams.append('h', height.toString())
        if (quality) queryParams.append('q', quality.toString())
        if (format) queryParams.append('f', format)

        const baseUrl = getUrl(path)
        const optimizedUrl = `${baseUrl}?${queryParams.toString()}`

        console.log('[CDN Plugin] Generated optimized image URL:', optimizedUrl)

        return optimizedUrl
      }

      // ============================================================================
      // PRELOAD IMAGE
      // ============================================================================
      const preloadImage = (path: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          const url = getUrl(path)

          img.onload = () => {
            console.log('[CDN Plugin] ✅ Image preloaded:', url)
            resolve()
          }

          img.onerror = () => {
            console.error('[CDN Plugin] ❌ Failed to preload image:', url)
            reject(new Error(`Failed to preload image: ${url}`))
          }

          img.src = url
        })
      }

      // ============================================================================
      // PRELOAD MULTIPLE IMAGES
      // ============================================================================
      const preloadImages = async (paths: string[]): Promise<void> => {
        try {
          console.log('[CDN Plugin] Preloading', paths.length, 'images...')
          await Promise.all(paths.map(path => preloadImage(path)))
          console.log('[CDN Plugin] ✅ All images preloaded successfully')
        } catch (error) {
          console.error('[CDN Plugin] ❌ Failed to preload some images:', error)
          throw error
        }
      }

      // ============================================================================
      // GET ASSET URL (for any asset type)
      // ============================================================================
      const getAssetUrl = (path: string, type?: string): string => {
        if (!config.enabled) {
          return path
        }

        const url = getUrl(path)
        console.log(`[CDN Plugin] Generated ${type || 'asset'} URL:`, url)

        return url
      }

      // ============================================================================
      // PROVIDE CDN UTILITIES
      // ============================================================================
      return {
        provide: {
          cdn: {
            config,
            getUrl,
            getImageUrl,
            preloadImage,
            preloadImages,
            getAssetUrl,
            isEnabled: () => config.enabled
          }
        }
      }

    } catch (error) {
      console.error('[CDN Plugin] ❌ Initialization failed:', error)

      // ✅ FIX: Provide fallback utilities to prevent app crash
      return {
        provide: {
          cdn: {
            config: {
              enabled: false,
              url: '',
              imageOptimization: false
            },
            getUrl: (path: string) => path,
            getImageUrl: (path: string) => path,
            preloadImage: async () => {},
            preloadImages: async () => {},
            getAssetUrl: (path: string) => path,
            isEnabled: () => false
          }
        }
      }
    }
  }
})

