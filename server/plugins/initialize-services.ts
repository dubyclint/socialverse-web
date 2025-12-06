// /server/plugins/initialize-services.ts
// SIMPLIFIED VERSION - No dynamic imports during initialization

export default defineNitroPlugin((nitroApp) => {
  console.log('🚀 [Initialize Services] Plugin loaded')
  
  // Don't initialize anything at startup
  // Services will be lazy-loaded when needed by individual routes
  
  console.log('✅ [Initialize Services] Ready')
})
