export default defineNitroPlugin((nitroApp) => {
  console.log('[Supabase Plugin] Initializing Supabase server plugin')

  // ✅ FIX: Ensure Supabase environment variables are set
  const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error('[Supabase Plugin] NUXT_PUBLIC_SUPABASE_URL is not set')
  }

  if (!supabaseAnonKey) {
    console.error('[Supabase Plugin] NUXT_PUBLIC_SUPABASE_ANON_KEY is not set')
  }

  if (!supabaseServiceKey) {
    console.warn('[Supabase Plugin] SUPABASE_SERVICE_ROLE_KEY is not set - some operations may fail')
  }

  console.log('[Supabase Plugin] Supabase URL:', supabaseUrl)
  console.log('[Supabase Plugin] Supabase plugin initialized successfully')
})

