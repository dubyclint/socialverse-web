// FILE: /server/plugins/database-context.ts
// SIMPLIFIED VERSION - No startup initialization

export default defineNitroPlugin((nitroApp) => {
  console.log('[Database Context Plugin] Initializing...')
  
  // Don't initialize at startup - let routes handle their own connections
  // This prevents bundling issues and startup crashes
  
  console.log('[Database Context Plugin] Ready')
})
