// FILE 1: /server/plugins/initialize-services.ts
// ============================================================================
// Initialize all critical services on server startup
// ============================================================================

import { CDNManager } from '../utils/cdn-manager';
import { LoadBalancer } from '../utils/load-balancer';
import { MLService } from '../ml/core/ml-service';

declare global {
  namespace NodeJS {
    interface Global {
      cdnManager: CDNManager;
      loadBalancer: LoadBalancer;
      mlService: MLService;
    }
  }
}

export default defineNitroPlugin(async (nitroApp) => {
  console.log('🚀 Initializing critical services...');

  try {
    // Initialize CDN Manager
    const cdnManager = new CDNManager();
    global.cdnManager = cdnManager;
    console.log('✅ CDN Manager initialized');

    // Initialize Load Balancer
    const loadBalancer = new LoadBalancer();
    global.loadBalancer = loadBalancer;
    console.log('✅ Load Balancer initialized');

    // Initialize ML Service
    const mlService = new MLService();
    await mlService.initialize();
    global.mlService = mlService;
    console.log('✅ ML Service initialized');

    // Make services available in event context
    nitroApp.hooks.hook('request', (event) => {
      event.context.cdnManager = cdnManager;
      event.context.loadBalancer = loadBalancer;
      event.context.mlService = mlService;
    });

    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    throw error;
  }
});
