// FILE: /server/plugins/initialize-services.ts
// ============================================================================
// Initialize all critical services on server startup
// REFACTORED: Defer MLService initialization to prevent Supabase bundling
// ============================================================================

import { CDNManager } from '../utils/cdn-manager'
import { LoadBalancer } from '../utils/load-balancer'
import type { MLService } from '../ml/core/ml-service'

declare global {
  namespace NodeJS {
    interface Global {
      cdnManager: CDNManager
      loadBalancer: LoadBalancer
      mlService: MLService | null
    }
  }
}

export default defineNitroPlugin(async (nitroApp) => {
  console.log('🚀 Initializing critical services...')

  try {
    // Initialize CDN Manager
    const cdnManager = new CDNManager()
    global.cdnManager = cdnManager
    console.log('✅ CDN Manager initialized')

    // Initialize Load Balancer
    const loadBalancer = new LoadBalancer()
    global.loadBalancer = loadBalancer
    console.log('✅ Load Balancer initialized')

    // ========================================================================
    // DEFERRED: ML Service initialization
    // ========================================================================
    // Don't initialize MLService at startup to prevent Supabase bundling
    // Instead, initialize on-demand when first needed
    global.mlService = null
    console.log('⏳ ML Service deferred (will initialize on first use)')

    // Make services available in event context
    nitroApp.hooks.hook('request', async (event) => {
      event.context.cdnManager = cdnManager
      event.context.loadBalancer = loadBalancer
      
      // Lazy initialize MLService on first request that needs it
      if (!global.mlService) {
        try {
          const { MLService } = await import('../ml/core/ml-service')
          global.mlService = new MLService()
          await global.mlService.initialize()
          console.log('✅ ML Service initialized on first use')
        } catch (error) {
          console.warn('⚠️ ML Service initialization deferred:', error)
          global.mlService = null
        }
      }
      
      event.context.mlService = global.mlService
    })

    console.log('✅ All services initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize services:', error)
    throw error
  }
})
