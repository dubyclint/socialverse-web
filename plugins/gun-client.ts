// ============================================================================
// FILE: /plugins/gun-client.ts - COMPLETE FIXED VERSION
// ============================================================================
// ✅ FIXED: Proper config reading with optional chaining
// ✅ FIXED: Handle undefined/false values correctly
// ✅ FIXED: Better logging for debugging
// ✅ FIXED: Add dependsOn to wait for Pinia
// ============================================================================

export default defineNuxtPlugin({
  name: 'socialverse-gun-client',
  // ✅ FIX: Wait for Pinia to be ready before initializing Gun
  dependsOn: ['pinia'],

  setup() {
    console.log('[Gun] Plugin loading...')

    // Default fallback provide value (returned on server or on error)
    const fallbackProvide = {
      provide: {
        gun: {
          config: { enabled: false, peers: [], localStorage: false, radisk: false, multicast: false, debug: false },
          getInstance: () => null,
          isEnabled: () => false,
        }
      }
    }

    try {
      // ============================================================================
      // ONLY RUN ON CLIENT-SIDE
      // ============================================================================
      if (!process.client) {
        console.log('[Gun] Server-side detected, skipping initialization')
        return fallbackProvide
      }

      console.log('[Gun] Client-side detected, initializing Gun...')

      // ============================================================================
      // GET RUNTIME CONFIG
      // ============================================================================
      const config = useRuntimeConfig()
      
      console.log('[Gun] Runtime config loaded')
      
      // ✅ FIX: Check if config.public exists and has values
      const gunEnabledFromConfig = config.public?.gunEnabled !== false
      const gunPeersFromConfig = config.public?.gunPeers || []
      
      console.log('[Gun] Gun Enabled (from config):', gunEnabledFromConfig)
      console.log('[Gun] Gun Peers (from config):', gunPeersFromConfig)

      // ============================================================================
      // CHECK IF WINDOW IS AVAILABLE
      // ============================================================================
      if (typeof window === 'undefined') {
        console.warn('[Gun] ⚠️ Window object not available')
        return fallbackProvide
      }

      // ============================================================================
      // INITIALIZE GUN CONFIGURATION
      // ============================================================================
      const gunConfig = {
        // ✅ FIX: Use config value, default to true if not explicitly false
        enabled: gunEnabledFromConfig,
        // ✅ FIX: Use config peers or empty array
        peers: Array.isArray(gunPeersFromConfig) ? gunPeersFromConfig : [],
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
      return fallbackProvide
    }
  }
})
