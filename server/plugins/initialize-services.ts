// /server/plugins/initialize-services.ts
import type { CDNManager } from '../utils/cdn-manager'
import type { LoadBalancer } from '../utils/load-balancer'
import type { MLService } from '../ml/core/ml-service'

declare global {
  namespace NodeJS {
    interface Global {
      cdnManager: CDNManager | null
      loadBalancer: LoadBalancer | null
      mlService: MLService | null
    }
  }
}

export default defineNitroPlugin(async (nitroApp) => {
  console.log('🚀 Initializing critical services...')

  try {
    // ========================================================================
    // DEFERRED: All service initialization
    // ========================================================================
    // Don't initialize services at startup to prevent Supabase bundling
    // Instead, initialize on-demand when first needed
    global.cdnManager = null
    global.loadBalancer = null
    global.mlService = null
    
    console.log('⏳ Services deferred (will initialize on first use)')

    // Make services available in event context
    nitroApp.hooks.hook('request', async (event) => {
      // Lazy initialize CDNManager on first request that needs it
      if (!global.cdnManager) {
        try {
          const { CDNManager } = await import('../utils/cdn-manager')
          global.cdnManager = new CDNManager()
          console.log('✅ CDN Manager initialized on first use')
        } catch (error) {
          console.warn('⚠️ CDN Manager initialization deferred:', error)
          global.cdnManager = null
        }
      }

      // Lazy initialize LoadBalancer on first request that needs it
      if (!global.loadBalancer) {
        try {
          const { LoadBalancer } = await import('../utils/load-balancer')
          global.loadBalancer = new LoadBalancer()
          global.loadBalancer.startHealthChecks()
          console.log('✅ Load Balancer initialized on first use')
        } catch (error) {
          console.warn('⚠️ Load Balancer initialization deferred:', error)
          global.loadBalancer = null
        }
      }

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

      event.context.cdnManager = global.cdnManager
      event.context.loadBalancer = global.loadBalancer
      event.context.mlService = global.mlService
    })

    console.log('✅ All services deferred successfully')
  } catch (error) {
    console.error('❌ Failed to initialize services:', error)
    throw error
  }
})
