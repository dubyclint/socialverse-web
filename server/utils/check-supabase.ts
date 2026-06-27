// FILE: /server/utils/check-supabase.ts
// ============================================================================
// Utility to check Supabase configuration
// ============================================================================

export async function checkSupabaseConfig() {
  const config = {
    url: process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!(process.env.SUPABASE_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY),
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  console.log('[Supabase Config Check]', {
    url: config.url,
    hasAnonKey: config.hasAnonKey,
    hasServiceKey: config.hasServiceKey,
    anonKeyLength: (process.env.SUPABASE_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY || '').length,
    serviceKeyLength: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').length
  })

  if (!config.url) {
    throw new Error('SUPABASE_URL is not configured')
  }

  if (!config.hasAnonKey) {
    throw new Error('SUPABASE_KEY is not configured')
  }

  // Service key is optional for some operations
  if (!config.hasServiceKey) {
    console.warn('[Supabase Config] ⚠️ SUPABASE_SERVICE_ROLE_KEY is not configured')
  }

  return config
}
