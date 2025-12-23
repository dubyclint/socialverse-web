// ============================================================================
// FILE 7: /plugins/gun-client.ts - COMPLETE FIXED VERSION
// ============================================================================
// ✅ FIXED: Gun plugin enabled
// ✅ FIXED: Proper client-side only initialization
// ✅ FIXED: Better error handling and logging
// ✅ ENHANCED: Gun configuration
// ============================================================================

export default defineNuxtPlugin(() => {
  console.log('[Gun] Plugin loading...')
  
  try {
    // ============================================================================
    // ONLY RUN ON CLIENT-SIDE
    // ============================================================================
    if (!process.client) {
      console.log('[Gun] Server-side detected, skipping initialization')
      return
    }

    console.log('[Gun] Client-side detected, initializing Gun...')

    // ============================================================================
    // GET RUNTIME CONFIG
    // ============================================================================
    const config = useRuntimeConfig()
    
    console.log('[Gun] Runtime config loaded')
    console.log('[Gun] Gun Enabled:', config.public.gunEnabled)
    console.log('[Gun] Gun Peers:', config.public.gunPeers)

    // ============================================================================
    // CHECK IF GUN IS AVAILABLE IN WINDOW
    // ============================================================================
    if (typeof window === 'undefined') {
      console.warn('[Gun] ⚠️ Window object not available')
      return
    }

    // ============================================================================
    // INITIALIZE GUN CONFIGURATION
    // ============================================================================
    const gunConfig = {
      enabled: config.public.gunEnabled || true,
      peers: config.public.gunPeers || [
        // Add your Gun server peers here
        // Example: 'https://gun-server.example.com/gun'
      ],
      localStorage: true,
      radisk: true,
      multicast: false,
      debug: process.env.NODE_ENV === 'development',
    }

    console.log('[Gun] ✅ Gun Configuration:')
    console.log('[Gun]   - Enabled:', gunConfig.enabled)
    console.log('[Gun]   - Peers:', gunConfig.peers.length > 0 ? gunConfig.peers : 'None (local only)')
    console.log('[Gun]   - LocalStorage:', gunConfig.localStorage)
    console.log('[Gun]   - RaDisk:', gunConfig.radisk)
    console.log('[Gun]   - Multicast:', gunConfig.multicast)
    console.log('[Gun]   - Debug:', gunConfig.debug)

    // ============================================================================
    // PROVIDE GUN UTILITIES
    // ============================================================================
    const getGunInstance = () => {
      if (!gunConfig.enabled) {
        console.warn('[Gun] Gun is disabled')
        return null
      }

      try {
        // Try to access Gun from window
        if (typeof window !== 'undefined' && (window as any).Gun) {
          console.log('[Gun] ✅ Gun instance available from window')
          return (window as any).Gun
        }

        console.warn('[Gun] ⚠️ Gun not found in window object')
        return null
      } catch (error) {
        console.error('[Gun] ❌ Error accessing Gun instance:', error)
        return null
      }
    }

    const isGunEnabled = (): boolean => {
      return gunConfig.enabled && getGunInstance() !== null
    }

    console.log('[Gun] ✅ Gun utilities created')

    // ============================================================================
    // RETURN PLUGIN EXPORTS
    // ============================================================================
    return {
      provide: {
        gun: {
          config: gunConfig,
          getInstance: getGunInstance,
          isEnabled: isGunEnabled,
        }
      }
    }

  } catch (error) {
    console.error('[Gun] ❌ Plugin initialization failed:', error)
    
    // Provide safe fallback
    return {
      provide: {
        gun: {
          config: { enabled: false },
          getInstance: () => null,
          isEnabled: () => false,
        }
      }
    }
  }
})
