// /server/plugins/initialize-services.ts
// TEMPORARY: Disabled to fix IIFE error

export default defineNitroPlugin((nitroApp) => {
  console.log('🚀 Services initialization DISABLED temporarily')
  
  // Set everything to null
  if (typeof global !== 'undefined') {
    (global as any).cdnManager = null;
    (global as any).loadBalancer = null;
    (global as any).mlService = null
  }
  
  console.log('✅ Plugin loaded successfully')
})

