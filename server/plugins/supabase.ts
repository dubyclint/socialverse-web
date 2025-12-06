// server/plugins/supabase.ts
// SIMPLIFIED VERSION - Lazy loading only

export default defineNitroPlugin((nitroApp) => {
  console.log('[Supabase Plugin] Initializing...')
  
  // Don't create Supabase clients at startup
  // Routes will create their own clients when needed
  
  console.log('[Supabase Plugin] Ready (lazy initialization)')
})
