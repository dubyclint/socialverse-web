// server/plugins/supabase.ts
// FIXED: No type imports, simple export

export default defineNitroPlugin((_nitroApp: any) => {
  console.log('[Supabase Plugin] Initializing...')
  console.log('[Supabase Plugin] Ready (lazy initialization)')
})
